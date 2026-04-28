\"\"\"\nPydantic Data Schemas for AgriSense API\n\nThis module defines all request and response schemas used across the AgriSense API.\nUsing Pydantic ensures:\n  - Type validation on all API inputs/outputs\n  - Automatic OpenAPI documentation generation\n  - Consistent data structure across frontend and backend\n  - Clear separation between data layers\n\nSchema Categories:\n  1. Market Data Schemas (prices, volatility, trends)\n  2. Yield Prediction Schemas (requests and predictions)\n  3. Climate Risk Schemas (climate risk assessments)\n  4. LLM Insight Schemas (conversational AI and insights)\n\"\"\"\n\nfrom pydantic import BaseModel, Field\nfrom typing import List, Optional\n\n\nclass PricePoint(BaseModel):\n    \"\"\"Individual price data point for time-series visualization.\n    \n    Used in sparklines and charts to show historical price trends.\n    \"\"\""
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
    \"\"\"Response schema for yield prediction with confidence metrics.\n    \n    Contains predicted yield value, historical comparison, and model confidence.\n    \"\"\"\n    predicted_yield: float
    unit: str
    confidence_pct: int
    historical_avg: float
    message: str


class ClimateRiskResponse(BaseModel):\n    \"\"\"Response schema for climate-based risk assessment.\n    \n    Provides overall risk level, score, and component-level risk metrics\n    for drought, flood, and frost conditions.\n    \"\"\""
    risk_level: str
    risk_score: int
    drought_risk: int
    flood_risk: int
    frost_risk: int
    irrigation_advice: str

class ChatMessage(BaseModel):
    \"\"\"Single message in a chat conversation.\n    \n    Represents either a user query or assistant response in the conversation history.\n    \"\"\"\n    role: str
    content: str


class ChatRequest(BaseModel):
    \"\"\"Request schema for multi-turn conversational insights.\n    \n    Includes current message, conversation history for context, and optional user profile.\n    \"\"\"\n    message: str
    history: List[ChatMessage] = []
    user_profile: Optional[dict] = None


class InsightRequest(BaseModel):
    \"\"\"Request schema for generating AI-powered agricultural insights.\n    \n    Combines crop, yield prediction, market price, and climate risk data\n    to generate personalized recommendations.\n    \"\"\"\n    crop: str
    predicted_yield: float
    current_price: float
    climate_risk_level: str
    location: Optional[str] = \"Himachal Pradesh\"


class InsightResponse(BaseModel):
    \"\"\"Response schema containing generated insight text.\n    \n    AI-generated recommendations and analysis based on input parameters.\n    \"\"\"\n    insight_text: str


class ChatResponse(BaseModel):
    \"\"\"Response schema for chat endpoint.\n    \n    Contains the assistant's reply to the user's latest message.\n    \"\"\"\n    reply: str

