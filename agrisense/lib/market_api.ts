/**
 * Market Data & Price Forecasting Client API with In-Memory Client Cache
 */

export interface PricePoint {
  date: string;
  price: number;
}

export interface MarketData {
  crop_name: string;
  current_price: number;
  price_change_7d_percent: number;
  rolling_avg_7d: number;
  rolling_avg_30d: number;
  volatility_7d: number;
  recent_prices: PricePoint[];
  last_updated?: string;
  message?: string;
}

export interface ForecastPoint {
  day_index: number;
  date: string;
  day_name: string;
  full_date: string;
  predicted_price: number;
  upper_bound_90pct: number;
  lower_bound_90pct: number;
  projected_change_inr: number;
}

export interface PriceForecastResponse {
  commodity: string;
  state: string;
  current_price: number;
  horizon_days: number;
  forecast_7d: {
    predicted_price: number;
    change_inr: number;
    change_pct: number;
  };
  forecast_14d: {
    predicted_price: number;
    change_inr: number;
    change_pct: number;
  };
  trade_advisory: {
    action: "HOLD" | "SELL" | "NEUTRAL";
    badge: string;
    badge_color: "green" | "red" | "amber";
    recommendation: string;
  };
  projections: ForecastPoint[];
}

function getBackendUrl(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

// Fast client-side in-memory cache to make page switching instant
const clientCache = new Map<string, { data: any; expiresAt: number }>();

function getFromClientCache<T>(key: string): T | null {
  const entry = clientCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }
  return null;
}

function setToClientCache(key: string, data: any, ttlSeconds: number = 300) {
  clientCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function fetchMarketData(crop: string, state?: string): Promise<MarketData | null> {
  const cacheKey = `market_data:${crop.toLowerCase()}:${state || "all"}`;
  const cached = getFromClientCache<MarketData>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({ crop });
    if (state) params.append("state", state);

    const res = await fetch(`${getBackendUrl()}/api/market-data?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch market data");
    const data: MarketData = await res.json();
    setToClientCache(cacheKey, data, 300);
    return data;
  } catch (err) {
    console.error("fetchMarketData error:", err);
    return null;
  }
}

export async function fetchPriceForecast(crop: string, state?: string, horizonDays: number = 14): Promise<PriceForecastResponse | null> {
  const cacheKey = `price_forecast:${crop.toLowerCase()}:${state || "all"}:${horizonDays}`;
  const cached = getFromClientCache<PriceForecastResponse>(cacheKey);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({ crop, horizon_days: horizonDays.toString() });
    if (state) params.append("state", state);

    const res = await fetch(`${getBackendUrl()}/api/market-data/forecast?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch price forecast");
    const data: PriceForecastResponse = await res.json();
    setToClientCache(cacheKey, data, 300);
    return data;
  } catch (err) {
    console.error("fetchPriceForecast error:", err);
    return null;
  }
}
