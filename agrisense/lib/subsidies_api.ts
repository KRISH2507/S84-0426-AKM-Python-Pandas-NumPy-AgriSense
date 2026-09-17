const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SubsidySchemeItem {
  id: string;
  title: string;
  category: string;
  provider: string;
  applicable_states: string[];
  applicable_crops: string[];
  farmer_categories: string[];
  min_acres?: number | null;
  max_acres?: number | null;
  benefit_type: string;
  benefit_summary: string;
  estimated_annual_benefit_inr: number;
  subsidy_rate: string;
  deadline?: string | null;
  urgency: string;
  required_documents: string[];
  official_url: string;
  description: string;
  days_left?: number;
}

export interface RecommendedSubsidiesResponse {
  farmer_category: string;
  state: string;
  crop: string;
  acres: number;
  total_eligible_schemes: number;
  total_estimated_benefit_inr: number;
  schemes: SubsidySchemeItem[];
  upcoming_deadlines: Array<{
    id: string;
    title: string;
    deadline: string;
    days_left: number;
    benefit_summary: string;
  }>;
  notification_badge?: string | null;
}

export interface InsuranceProviderQuote {
  name: string;
  type: string;
  claim_settlement_ratio_pct: number;
  helpline: string;
}

export interface InsuranceQuoteResponse {
  crop: string;
  season: string;
  state: string;
  acres: number;
  current_mandi_price_per_quintal: number;
  estimated_yield_quintal_per_acre: number;
  sum_insured_per_acre: number;
  total_sum_insured: number;
  farmer_rate_pct: number;
  farmer_premium_payable: number;
  government_subsidy_amount: number;
  total_actuarial_premium: number;
  subsidy_percentage: number;
  climate_risk_alert?: string | null;
  urgency_level: string;
  claim_triggers: Array<{
    stage: string;
    description: string;
    payout_pct: number;
  }>;
  eligible_providers: InsuranceProviderQuote[];
}

export async function getRecommendedSubsidies(params: {
  state: string;
  crop: string;
  acres: number;
  season?: string;
}): Promise<RecommendedSubsidiesResponse> {
  const query = new URLSearchParams({
    state: params.state,
    crop: params.crop,
    acres: params.acres.toString(),
  });
  if (params.season) query.append("season", params.season);

  const res = await fetch(`${BASE_URL}/api/subsidies/recommended?${query.toString()}`, {
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch subsidies: ${res.statusText}`);
  }
  return res.json();
}

export async function getInsuranceQuote(params: {
  crop: string;
  state: string;
  acres: number;
  season?: string;
  custom_coverage_per_acre?: number;
}): Promise<InsuranceQuoteResponse> {
  const query = new URLSearchParams({
    crop: params.crop,
    state: params.state,
    acres: params.acres.toString(),
  });
  if (params.season) query.append("season", params.season);
  if (params.custom_coverage_per_acre) {
    query.append("custom_coverage_per_acre", params.custom_coverage_per_acre.toString());
  }

  const res = await fetch(`${BASE_URL}/api/insurance/quote?${query.toString()}`, {
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch insurance quote: ${res.statusText}`);
  }
  return res.json();
}

export async function ingestNewScheme(payload: {
  text_announcement?: string;
  scheme_json?: any;
  source_url?: string;
}): Promise<{
  success: boolean;
  action: string;
  scheme?: SubsidySchemeItem;
  message: string;
}> {
  const res = await fetch(`${BASE_URL}/api/subsidies/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to ingest scheme: ${res.statusText}`);
  }
  return res.json();
}
