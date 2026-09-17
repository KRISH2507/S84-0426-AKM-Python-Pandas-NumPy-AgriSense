from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- Plot Schemas ---
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

# --- Tracked Subsidy Schemas ---
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

# --- Farmer Schemas ---
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
