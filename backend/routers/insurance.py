from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from schemas import InsuranceQuoteRequest, InsuranceQuoteResponse
from services.insurance_service import insurance_service

router = APIRouter(prefix="/api/insurance", tags=["Crop Insurance Engine"])

@router.get("/quote", response_model=InsuranceQuoteResponse)
def get_insurance_quote(
    crop: str = Query("Wheat", description="Crop name"),
    state: str = Query("Punjab", description="State location"),
    acres: float = Query(3.0, ge=0.1, description="Farm acreage"),
    season: Optional[str] = Query(None, description="Season (Rabi, Kharif, Annual)"),
    custom_coverage_per_acre: Optional[float] = Query(None, description="Optional custom sum insured per acre")
):
    """
    Computes a real-time, dynamic crop insurance quote according to PMFBY rules,
    linking exact current Mandi commodity rates and yield expectations.
    """
    try:
        quote = insurance_service.calculate_quote(
            crop=crop,
            acres=acres,
            state=state,
            season=season,
            custom_coverage_per_acre=custom_coverage_per_acre
        )
        return quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insurance quote: {str(e)}")

@router.post("/calculate-premium", response_model=InsuranceQuoteResponse)
def calculate_premium_post(request: InsuranceQuoteRequest):
    """
    POST method for interactive insurance quote calculators.
    """
    try:
        quote = insurance_service.calculate_quote(
            crop=request.crop,
            acres=request.acres,
            state=request.state,
            season=request.season,
            custom_coverage_per_acre=request.custom_coverage_per_acre
        )
        return quote
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate premium: {str(e)}")
