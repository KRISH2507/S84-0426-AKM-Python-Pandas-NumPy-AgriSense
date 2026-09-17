/**
 * AgriSense Smart Crop Doctor & Climate Alerts Client API
 */

export interface ChemicalControl {
  active_ingredient: string;
  brand_examples: string;
  dose_per_liter: string;
  dose_per_acre: string;
  application_instructions: string;
  phi_days: number;
}

export interface OrganicControl {
  remedy: string;
  preparation: string;
  application: string;
}

export interface Disease {
  id: string;
  crop: string;
  common_name: string;
  hindi_name: string;
  marathi_name: string;
  tamil_name: string;
  scientific_name: string;
  affected_part: "leaf" | "fruit" | "stem" | "root";
  symptoms: string[];
  description: string;
  favorable_weather: string;
  severity: "Low" | "Moderate" | "High" | "Critical";
  chemical_control: ChemicalControl;
  organic_control: OrganicControl;
  preventive_practices: string[];
}

export interface DiagnosisResult {
  disease: Disease;
  confidence_pct: number;
  matching_symptoms: string[];
  part_matched: boolean;
}

export interface DosageCalculation {
  disease_id: string;
  disease_name: string;
  hindi_name: string;
  acres: number;
  total_spray_water_liters: number;
  knapsack_tanks_15L: number;
  battery_tanks_20L: number;
  active_ingredient: string;
  brand_examples: string;
  dose_per_liter: string;
  total_product_for_farm: string;
  application_instructions: string;
  phi_days: number;
  organic_remedy: string;
  organic_preparation: string;
}

export interface DayForecast {
  date: string;
  day_name: string;
  full_date: string;
  temp_max: number;
  temp_min: number;
  temp_range: string;
  precipitation_mm: number;
  rain_probability: number;
  wind_speed_kmh: number;
  condition: string;
  spray_window: {
    status: "Optimal" | "Marginal" | "Hazard";
    color: "green" | "amber" | "red";
    note: string;
  };
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  crop: string;
  forecast_days: number;
  optimal_spray_days: string[];
  daily: DayForecast[];
}

export interface FieldAlert {
  id: string;
  urgency: "CRITICAL" | "WARNING" | "ADVISORY";
  title: string;
  hindi_title: string;
  category: string;
  description: string;
  action: string;
  action_link: string;
  icon: string;
}

export interface AlertsResponse {
  crop: string;
  state: string;
  total_alerts: number;
  unread_count: number;
  spray_recommendation: string;
  sms_dispatch_payload: string;
  alerts: FieldAlert[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function diagnoseDisease(crop: string, affected_part: string, symptoms: string[]): Promise<DiagnosisResult[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/crop-doctor/diagnose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crop, affected_part, symptoms }),
    });
    if (!res.ok) throw new Error("Diagnosis failed");
    const data = await res.json();
    return data.diagnoses || [];
  } catch (err) {
    console.error("Crop doctor diagnosis error:", err);
    return [];
  }
}

export async function fetchSymptomsCatalog(): Promise<Record<string, Array<{ id: string; en: string; hi: string; mr: string; ta: string }>>> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/crop-doctor/symptoms-catalog`);
    if (!res.ok) throw new Error("Catalog fetch failed");
    return await res.json();
  } catch (err) {
    console.error("Symptoms catalog error:", err);
    return {
      leaf: [
        { id: "yellow_spots", en: "Yellow spots / chlorosis", hi: "पीले धब्बे", mr: "पिवळे डाग", ta: "மஞ்சள் புள்ளிகள்" },
        { id: "brown_blight", en: "Brown blighting / drying", hi: "भूरा झुलसा", mr: "तपकिरी करपा", ta: "பழுப்பு கருகல்" },
        { id: "rust_pustules", en: "Orange / Yellow rust pustules", hi: "रतुआ के दाने", mr: "तांबेरा फोड", ta: "துரு கொப்புளங்கள்" },
        { id: "leaf_curl", en: "Upward / downward leaf curling", hi: "पत्ते मुड़ना (मरोड़िया)", mr: "पाने आकसणे", ta: "இலை சுருட்டு" },
        { id: "white_powder", en: "White powdery patches", hi: "सफेद पाउडर जैसी फफूंद", mr: "पांढरी बुरशी", ta: "வெள்ளை சாம்பல்" },
      ],
      fruit: [
        { id: "holes", en: "Boring holes & caterpillar droppings", hi: "फलों में छेद व इल्ली", mr: "फळांमधील छिद्रे", ta: "காயில் துளைகள்" },
        { id: "black_rot", en: "Black rot / fruit decay", hi: "काला सड़ांध", mr: "काळी सड", ta: "கருப்பு அழுகல்" },
      ]
    };
  }
}

export async function calculateDosage(disease_id: string, acres: number): Promise<DosageCalculation | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/crop-doctor/dosage?disease_id=${encodeURIComponent(disease_id)}&acres=${acres}`);
    if (!res.ok) throw new Error("Dosage calculation failed");
    return await res.json();
  } catch (err) {
    console.error("Dosage calculation error:", err);
    return null;
  }
}

export async function fetchClimateForecast(lat?: number, lon?: number, crop?: string): Promise<ForecastResponse | null> {
  try {
    const params = new URLSearchParams();
    if (lat) params.append("lat", lat.toString());
    if (lon) params.append("lon", lon.toString());
    if (crop) params.append("crop", crop);

    const res = await fetch(`${BACKEND_URL}/api/climate-risk/forecast?${params.toString()}`);
    if (!res.ok) throw new Error("Forecast fetch failed");
    return await res.json();
  } catch (err) {
    console.error("Forecast fetch error:", err);
    return null;
  }
}

export async function fetchFieldAlerts(lat?: number, lon?: number, crop: string = "Wheat", state: string = "Punjab"): Promise<AlertsResponse | null> {
  try {
    const params = new URLSearchParams({ crop, state });
    if (lat) params.append("lat", lat.toString());
    if (lon) params.append("lon", lon.toString());

    const res = await fetch(`${BACKEND_URL}/api/climate-risk/alerts?${params.toString()}`);
    if (!res.ok) throw new Error("Field alerts fetch failed");
    return await res.json();
  } catch (err) {
    console.error("Field alerts error:", err);
    return null;
  }
}
