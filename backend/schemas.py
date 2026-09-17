from pydantic import BaseModel, Field
from typing import List, Optional

class PricePoint(BaseModel):
    """Schema for individual data points in sparklines/charts"""
    date: str = Field(..., description="Date of the record (YYYY-MM-DD)")
    price: float = Field(..., description="Modal price on that date")

class MarketDataResponse(BaseModel):
    """
    Standardized response schema for the Market Data dashboard.
    Using Pydantic ensures the API always returns the exact structure React expects!
    """
    crop_name: str = Field(..., description="Name of the agricultural commodity")
    current_price: float = Field(..., description="Latest available modal price")
    price_change_7d_percent: float = Field(..., description="Percentage change day-over-day (our engineered feature)")
    rolling_avg_7d: float = Field(..., description="7-Day Smoothed Rolling Average")
    rolling_avg_30d: float = Field(..., description="30-Day Smoothed Rolling Average")
    volatility_7d: float = Field(..., description="Price volatility (standard deviation) over the last 7 days")
    recent_prices: List[PricePoint] = Field(..., description="Array of up to 30 recent prices for UI sparklines")
    last_updated: Optional[str] = Field(None, description="The date of the most recent price record")
    message: Optional[str] = Field(None, description="Optional system message")

# --- Yield Prediction Schemas (3.3) ---
class YieldPredictRequest(BaseModel):
    crop: str = Field(..., description="Crop type (e.g., Wheat, Rice)")
    rainfall_mm: float = Field(..., description="Expected rainfall in mm")
    fertilizer_pct: float = Field(..., description="Amount of fertilizer applied (pct or kg/acre)")
    season: str = Field(..., description="Agricultural season (e.g., Rabi, Kharif, Zaid)")
    field_acres: float = Field(..., description="Size of the field in acres")
    soil_type: Optional[str] = Field("Alluvial", description="Soil type")

class YieldPredictResponse(BaseModel):
    predicted_yield: float
    unit: str
    confidence_pct: int
    historical_avg: float
    message: str

# --- Climate Risk Schemas (3.4) ---
class ClimateRiskResponse(BaseModel):
    risk_level: str
    risk_score: int
    drought_risk: int
    flood_risk: int
    frost_risk: int
    irrigation_advice: str

# --- LLM Insight Schemas (3.5) ---
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    user_profile: Optional[dict] = None

class InsightRequest(BaseModel):
    crop: str
    predicted_yield: float
    current_price: float
    climate_risk_level: str
    location: Optional[str] = "Himachal Pradesh"

class InsightResponse(BaseModel):
    insight_text: str

class ChatResponse(BaseModel):
    reply: str

# --- Subsidies & Insurance Schemas ---
class SubsidySchemeItem(BaseModel):
    id: str
    title: str
    category: str
    provider: str
    applicable_states: List[str]
    applicable_crops: List[str]
    farmer_categories: List[str]
    min_acres: Optional[float] = None
    max_acres: Optional[float] = None
    benefit_type: str
    benefit_summary: str
    estimated_annual_benefit_inr: float
    subsidy_rate: str
    deadline: Optional[str] = None
    urgency: str
    required_documents: List[str]
    official_url: str
    description: str

class RecommendedSubsidiesResponse(BaseModel):
    farmer_category: str
    state: str
    crop: str
    acres: float
    total_eligible_schemes: int
    total_estimated_benefit_inr: float
    schemes: List[SubsidySchemeItem]
    upcoming_deadlines: List[dict]
    notification_badge: Optional[str] = None

class AllSubsidiesResponse(BaseModel):
    total_active: int
    total_historical: int
    last_sync: str
    active_schemes: List[SubsidySchemeItem]
    historical_schemes: List[dict]

class IngestSchemeRequest(BaseModel):
    text_announcement: Optional[str] = Field(None, description="Raw press release or circular text")
    scheme_json: Optional[dict] = Field(None, description="Direct structured scheme object")
    source_url: Optional[str] = Field(None, description="Official portal reference link")

class IngestSchemeResponse(BaseModel):
    success: bool
    action: str
    scheme: Optional[SubsidySchemeItem] = None
    message: str

class InsuranceQuoteRequest(BaseModel):
    crop: str = Field(..., description="Crop name (e.g., Wheat, Rice, Tomato)")
    state: Optional[str] = Field("Punjab", description="State location")
    acres: float = Field(..., ge=0.1, description="Farm land size in acres")
    season: Optional[str] = Field("Rabi", description="Cropping season (Rabi, Kharif, Annual)")
    custom_coverage_per_acre: Optional[float] = Field(None, description="Custom override for Sum Insured per acre")

class InsuranceProviderQuote(BaseModel):
    name: str
    type: str
    claim_settlement_ratio_pct: float
    helpline: str

class InsuranceQuoteResponse(BaseModel):
    crop: str
    season: str
    state: str
    acres: float
    current_mandi_price_per_quintal: float
    estimated_yield_quintal_per_acre: float
    sum_insured_per_acre: float
    total_sum_insured: float
    farmer_rate_pct: float
    farmer_premium_payable: float
    government_subsidy_amount: float
    total_actuarial_premium: float
    subsidy_percentage: float
    climate_risk_alert: Optional[str] = None
    urgency_level: str
    claim_triggers: List[dict]
    eligible_providers: List[InsuranceProviderQuote]

# --- Farmer & Farm Plot Database Schemas ---
from datetime import datetime

class FarmPlotBase(BaseModel):
    plot_name: str = Field(..., description="Name or identifier for the plot")
    crop: str = Field(..., description="Primary crop sown")
    season: str = Field(..., description="Cropping season (Rabi, Kharif, Zaid)")
    acres: float = Field(..., gt=0.0, description="Plot size in acres")
    soil_type: Optional[str] = Field("Alluvial Loam", description="Soil variety")
    lat: Optional[float] = 30.9010
    lng: Optional[float] = 75.8573
    irrigation_type: Optional[str] = "Canal + Tubewell"

class FarmPlotCreate(FarmPlotBase):
    pass

class FarmPlotResponse(FarmPlotBase):
    id: int
    farmer_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TrackedSubsidyBase(BaseModel):
    scheme_id: str
    scheme_title: str
    status: str = Field("BOOKMARKED", description="BOOKMARKED, APPLIED, UNDER_REVIEW, DISBURSED")
    application_ref_number: Optional[str] = None
    applied_date: Optional[str] = None
    disbursement_amount_inr: Optional[float] = None
    notes: Optional[str] = None

class TrackedSubsidyCreate(TrackedSubsidyBase):
    pass

class TrackedSubsidyUpdate(BaseModel):
    status: Optional[str] = None
    application_ref_number: Optional[str] = None
    applied_date: Optional[str] = None
    disbursement_amount_inr: Optional[float] = None
    notes: Optional[str] = None

class TrackedSubsidyResponse(TrackedSubsidyBase):
    id: int
    farmer_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FarmerRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Farmer full name")
    email: str = Field(..., description="Login email")
    phone: Optional[str] = None
    password: str = Field(..., min_length=4, description="Password")
    primary_state: str = Field("Punjab", description="State location")
    primary_district: Optional[str] = "Ludhiana"
    initial_crop: Optional[str] = "Wheat"
    initial_acres: Optional[float] = 3.0

class FarmerLoginRequest(BaseModel):
    email: str
    password: str

class FarmerUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    primary_state: Optional[str] = None
    primary_district: Optional[str] = None

class FarmerResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    primary_state: str
    primary_district: Optional[str] = None
    total_acres: float
    plots: List[FarmPlotResponse] = []
    tracked_subsidies: List[TrackedSubsidyResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

# --- Mandi Live Pipeline Schemas ---
class MandiRecordItem(BaseModel):
    market: str
    state: str
    district: str
    commodity: str
    min_price: float
    max_price: float
    modal_price: float
    arrivals_tonnes: float
    trend: str # 'up' or 'down'
    change_pct: float
    price_history_7d: List[float] = []
    last_updated: str

class MandiListResponse(BaseModel):
    total_mandis: int
    active_states: List[str]
    commodities: List[str]
    records: List[MandiRecordItem]
    last_sync_timestamp: str

class MandiArbitrageResponse(BaseModel):
    commodity: str
    state: str
    highest_paying_mandi: str
    highest_modal_price: float
    lowest_paying_mandi: str
    lowest_modal_price: float
    price_spread_inr: float
    spread_percentage: float
    recommendation: str

