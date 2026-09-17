/**
 * Central API Client for AgriSense Platform
 * Communicates with FastAPI backend with built-in in-memory caching and request deduplication
 */

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

// In-memory cache for GET requests to achieve instant (0ms) page re-visits
interface CacheEntry {
  data: any;
  timestamp: number;
}
const apiCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Helper to handle fetch responses with in-memory caching and deduplication
 */
async function fetchWithHandler(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs = 5000,
  useCache = false
) {
  const baseUrl = getApiBaseUrl();
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const cacheKey = `${baseUrl}${endpoint}`;

  // 1. Check cache for GET requests
  if (isGet && useCache) {
    const cached = apiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    // 2. Deduplicate in-flight GET requests
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }
  }

  const executeFetch = async () => {
    try {
      const defaultHeaders: HeadersInit = {
        "Content-Type": "application/json",
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = `API request failed with status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMsg =
              typeof errorData.detail === "string"
                ? errorData.detail
                : JSON.stringify(errorData.detail);
          }
        } catch (parseErr) {
          // Ignore JSON parse errors
        }

        // Log but don't crash on 404/no data scenarios
        if (response.status === 404) {
          console.warn(`[API 404] ${endpoint}: ${errorMsg}`);
          return { data: [], message: errorMsg };
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Store in memory cache
      if (isGet && useCache) {
        apiCache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error: any) {
      // Check if stale cached data exists to gracefully serve on error
      const stale = apiCache.get(cacheKey);
      if (stale) {
        console.warn(`[API Fallback to Cache] ${endpoint}:`, error.message);
        return stale.data;
      }

      if (error.name === "AbortError") {
        throw new Error(`Connection timed out. Unable to reach server at ${BASE_URL}.`);
      }
      if (error.message && (error.message.includes("Failed to fetch") || error.name === "TypeError")) {
        throw new Error(`Unable to connect to server. Please make sure the backend is running on ${BASE_URL}`);
      }
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    } finally {
      if (isGet && useCache) {
        inFlightRequests.delete(cacheKey);
      }
    }
  };

  if (isGet && useCache) {
    const promise = executeFetch();
    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  return executeFetch();
}

/**
 * Fetch market data for a specific crop and optionally state.
 */
export async function getMarketData(crop: string, state?: string) {
  const params = new URLSearchParams({ crop });
  if (state) params.append("state", state);
  const data = await fetchWithHandler(`/api/market-data?${params.toString()}`, {}, 5000, true);

  // If market data returns 0 explicitly (dataset doesn't have it), mark it missing
  if (data && (data.current_price === 0 || !data.recent_prices || data.recent_prices.length === 0)) {
    return {
      ...data,
      is_missing_data: true,
      crop_name: crop,
      current_price: 0,
      message: `Market data not available for ${crop} right now.`,
    };
  }

  return data;
}

/**
 * Predict crop yield using the ML model.
 */
export async function predictYield(params: {
  crop: string;
  rainfall_mm: number;
  fertilizer_pct: number;
  season: string;
  field_acres?: number;
}) {
  return fetchWithHandler("/api/yield-predict", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

/**
 * Fetch climate risk evaluation for a location based on a crop.
 */
export async function getClimateRisk(lat?: number, lon?: number, crop?: string) {
  const params = new URLSearchParams();
  if (lat !== undefined) params.append("lat", lat.toString());
  if (lon !== undefined) params.append("lon", lon.toString());
  if (crop) params.append("crop", crop);

  const queryString = params.toString();
  const endpoint = `/api/climate-risk${queryString ? `?${queryString}` : ""}`;

  return fetchWithHandler(endpoint, {}, 5000, true);
}

/**
 * Request actionable insights from the LLM based on farm/market data.
 */
export async function getLLMInsight(data: object) {
  return fetchWithHandler("/api/llm-insight", {
    method: "POST",
    body: JSON.stringify(data),
  }, 12000);
}

/**
 * Send a chat message to the AI Advisor.
 */
export async function sendChatMessage(history: any[], message: string, userProfile?: any) {
  return fetchWithHandler("/api/llm-insight", {
    method: "POST",
    body: JSON.stringify({ history, message, user_profile: userProfile }),
  }, 15000);
}
