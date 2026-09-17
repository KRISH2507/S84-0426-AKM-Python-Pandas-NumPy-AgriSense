function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export interface FarmPlot {
  id: number;
  farmer_id: number;
  plot_name: string;
  crop: string;
  season: string;
  acres: number;
  soil_type?: string;
  lat?: number;
  lng?: number;
  irrigation_type?: string;
  created_at: string;
}

export interface TrackedSubsidy {
  id: number;
  farmer_id: number;
  scheme_id: string;
  scheme_title: string;
  status: "BOOKMARKED" | "APPLIED" | "UNDER_REVIEW" | "DISBURSED";
  application_ref_number?: string;
  applied_date?: string;
  disbursement_amount_inr?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FarmerProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  primary_state: string;
  primary_district?: string;
  total_acres: number;
  plots: FarmPlot[];
  tracked_subsidies: TrackedSubsidy[];
  created_at: string;
}

export async function getFarmerProfile(farmerId = 1): Promise<FarmerProfile> {
  const res = await fetch(`${getBaseUrl()}/api/farmer/profile/${farmerId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load farmer profile from database");
  }
  return res.json();
}

export async function updateFarmerProfile(farmerId: number, data: {
  name?: string;
  phone?: string;
  primary_state?: string;
  primary_district?: string;
}): Promise<FarmerProfile> {
  const res = await fetch(`${getBaseUrl()}/api/farmer/profile/${farmerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update profile");
  }
  return res.json();
}

export async function addFarmPlot(farmerId: number, plotData: {
  plot_name: string;
  crop: string;
  season: string;
  acres: number;
  soil_type?: string;
  lat?: number;
  lng?: number;
  irrigation_type?: string;
}): Promise<FarmPlot> {
  const res = await fetch(`${getBaseUrl()}/api/farmer/${farmerId}/plots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plotData),
  });
  if (!res.ok) {
    throw new Error("Failed to add plot");
  }
  return res.json();
}

export async function deleteFarmPlot(farmerId: number, plotId: number): Promise<boolean> {
  const res = await fetch(`${getBaseUrl()}/api/farmer/${farmerId}/plots/${plotId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete plot");
  }
  return true;
}

export async function trackSubsidyApplication(farmerId: number, data: {
  scheme_id: string;
  scheme_title: string;
  status: string;
  application_ref_number?: string;
  applied_date?: string;
  notes?: string;
}): Promise<TrackedSubsidy> {
  const res = await fetch(`${getBaseUrl()}/api/farmer/${farmerId}/subsidies/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to track subsidy");
  }
  return res.json();
}

export async function updateTrackedSubsidy(farmerId: number, trackId: number, data: {
  status?: string;
  application_ref_number?: string;
  notes?: string;
}): Promise<TrackedSubsidy> {
  const res = await fetch(`${getBaseUrl()}/api/farmer/${farmerId}/subsidies/${trackId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("Failed to update tracked subsidy");
  }
  return res.json();
}
