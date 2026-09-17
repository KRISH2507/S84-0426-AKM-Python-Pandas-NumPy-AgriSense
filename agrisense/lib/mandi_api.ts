function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export interface MandiRecordItem {
  market: string;
  state: string;
  district: string;
  commodity: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrivals_tonnes: number;
  trend: "up" | "down";
  change_pct: number;
  price_history_7d: number[];
  last_updated: string;
}

export interface MandiListResponse {
  total_mandis: number;
  active_states: string[];
  commodities: string[];
  records: MandiRecordItem[];
  last_sync_timestamp: string;
}

export interface MandiArbitrageResponse {
  commodity: string;
  state: string;
  highest_paying_mandi: string;
  highest_modal_price: number;
  lowest_paying_mandi: string;
  lowest_modal_price: number;
  price_spread_inr: number;
  spread_percentage: number;
  recommendation: string;
}

export async function getMandiRates(params?: {
  state?: string;
  commodity?: string;
  district?: string;
  search?: string;
  sort_by?: string;
}): Promise<MandiListResponse> {
  const query = new URLSearchParams();
  if (params?.state && params.state !== "All") query.append("state", params.state);
  if (params?.commodity && params.commodity !== "All") query.append("commodity", params.commodity);
  if (params?.district && params.district !== "All") query.append("district", params.district);
  if (params?.search) query.append("search", params.search);
  if (params?.sort_by) query.append("sort_by", params.sort_by);

  const res = await fetch(`${getBaseUrl()}/api/mandi/rates?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load Mandi rates");
  }
  return res.json();
}

export async function getMandiArbitrage(commodity = "Wheat", state = "Punjab"): Promise<MandiArbitrageResponse> {
  const query = new URLSearchParams({ commodity, state });
  const res = await fetch(`${getBaseUrl()}/api/mandi/arbitrage?${query.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load arbitrage opportunity");
  }
  return res.json();
}

export async function syncMandiRates(): Promise<{ success: boolean; message: string; last_sync: string }> {
  const res = await fetch(`${getBaseUrl()}/api/mandi/sync`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error("Failed to sync mandi rates");
  }
  return res.json();
}
