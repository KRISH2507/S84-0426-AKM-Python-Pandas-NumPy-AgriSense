from fastapi import APIRouter, Query
from typing import Optional
from schemas import ClimateRiskResponse
from services.climate_service import climate_service

router = APIRouter(prefix="/api/climate-risk", tags=["Climate & Agronomic Alerts"])

@router.get("", response_model=ClimateRiskResponse)
def get_climate_risk(
    lat: Optional[float] = Query(None, description="Latitude of the farm"),
    lon: Optional[float] = Query(None, description="Longitude of the farm"),
    crop: Optional[str] = Query(None, description="Optional target crop")
):
    """
    Fetches weather data and calculates risk scores for drought, flood, and frost.
    """
    return climate_service.get_climate_risk(lat=lat, lon=lon, crop=crop)

@router.get("/forecast")
def get_10_day_forecast(
    lat: Optional[float] = Query(None, description="Latitude of the farm"),
    lon: Optional[float] = Query(None, description="Longitude of the farm"),
    crop: Optional[str] = Query(None, description="Target crop")
):
    """
    Returns high-resolution 10-day daily forecast cards with pesticide
    spraying feasibility windows (Optimal, Marginal, Hazard).
    """
    return climate_service.get_10_day_forecast(lat=lat, lon=lon, crop=crop)

@router.get("/alerts")
def get_field_alerts(
    lat: Optional[float] = Query(None, description="Latitude of the farm"),
    lon: Optional[float] = Query(None, description="Longitude of the farm"),
    crop: Optional[str] = Query("Wheat", description="Target crop"),
    state: Optional[str] = Query("Punjab", description="State")
):
    """
    Returns prioritized agronomic field hazard alerts (disease outbreak conditions,
    heat stress, heavy rainfall washout) with simulated SMS push payload.
    """
    return climate_service.get_active_field_alerts(lat=lat, lon=lon, crop=crop, state=state)
