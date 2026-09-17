"""
Dual-Mode High-Performance Caching Service for AgriSense.
- Local / Development: Fast, in-memory TTL dictionary cache (zero external dependencies, sub-millisecond).
- Production / Deployment: Seamlessly connects to Redis if REDIS_URL is configured in .env / environment.
"""

import os
import time
import json
import functools
from typing import Any, Optional, Callable
from datetime import datetime

class InMemoryTTLCache:
    def __init__(self):
        self._cache = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            entry = self._cache[key]
            if time.time() < entry["expires_at"]:
                return entry["data"]
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        self._cache[key] = {
            "data": value,
            "expires_at": time.time() + ttl_seconds
        }

    def delete(self, key: str):
        if key in self._cache:
            del self._cache[key]

    def clear(self):
        self._cache.clear()

    def stats(self) -> dict:
        now = time.time()
        active = sum(1 for e in self._cache.values() if now < e["expires_at"])
        return {"type": "in_memory", "total_keys": len(self._cache), "active_keys": active}


class CacheService:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL")
        self.redis_client = None
        self.in_memory = InMemoryTTLCache()
        self._mode = "in_memory"
        self._init_redis()

    def _init_redis(self):
        """Attempts to initialize Redis only if REDIS_URL is set in environment."""
        if self.redis_url:
            try:
                import redis
                self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
                self.redis_client.ping()
                self._mode = "redis"
                print(f"[OK] CacheService connected to Redis at {self.redis_url}")
            except Exception as e:
                print(f"[INFO] CacheService: REDIS_URL configured but connection failed ({e}). Falling back to in-memory TTL cache.")
                self.redis_client = None
                self._mode = "in_memory"
        else:
            self._mode = "in_memory"

    def get(self, key: str) -> Optional[Any]:
        if self.redis_client:
            try:
                val = self.redis_client.get(key)
                if val is not None:
                    return json.loads(val)
            except Exception:
                pass
        return self.in_memory.get(key)

    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        if self.redis_client:
            try:
                serialized = json.dumps(value, default=str)
                self.redis_client.setex(key, ttl_seconds, serialized)
                return
            except Exception:
                pass
        self.in_memory.set(key, value, ttl_seconds)

    def delete(self, key: str):
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception:
                pass
        self.in_memory.delete(key)

    def clear(self):
        if self.redis_client:
            try:
                self.redis_client.flushdb()
            except Exception:
                pass
        self.in_memory.clear()

    def get_status(self) -> dict:
        return {
            "mode": self._mode,
            "redis_connected": bool(self.redis_client),
            "in_memory_stats": self.in_memory.stats()
        }

cache_service = CacheService()

def cache_response(ttl_seconds: int = 300, key_prefix: str = "api"):
    """
    Decorator for FastAPI endpoint functions to automatically cache responses.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Construct deterministic cache key
            kwargs_str = "_".join(f"{k}:{v}" for k, v in sorted(kwargs.items()) if v is not None)
            cache_key = f"{key_prefix}:{func.__name__}:{kwargs_str}"
            
            cached = cache_service.get(cache_key)
            if cached is not None:
                return cached

            result = func(*args, **kwargs)
            cache_service.set(cache_key, result, ttl_seconds)
            return result

        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            kwargs_str = "_".join(f"{k}:{v}" for k, v in sorted(kwargs.items()) if v is not None)
            cache_key = f"{key_prefix}:{func.__name__}:{kwargs_str}"
            
            cached = cache_service.get(cache_key)
            if cached is not None:
                return cached

            result = await func(*args, **kwargs)
            cache_service.set(cache_key, result, ttl_seconds)
            return result

        import inspect
        return async_wrapper if inspect.iscoroutinefunction(func) else sync_wrapper
    return decorator
