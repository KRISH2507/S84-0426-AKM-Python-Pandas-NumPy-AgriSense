from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from schemas import MarketDataResponse
from services.data_service import data_service
from services.price_forecast_service import price_forecast_service
from services.cache_service import cache_response

# Create an APIRouter for all Market-related endpoints
router = APIRouter(prefix="/api/market-data", tags=["Market Dashboard"])

@router.get("", response_model=MarketDataResponse)
@cache_response(ttl_seconds=300, key_prefix="market_data")
def fetch_market_data(
    crop: str = Query(..., description="Crop name to fetch data for (e.g., 'Wheat', 'Tomato', 'Rice')"),
    state: Optional[str] = Query(None, description="Filter prices by specific state (Optional)"),
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format (Optional)"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD format (Optional)")
):
    """
    Get comprehensive market data for a specific crop with 300-second cache.
    """
    try:
        result = data_service.get_market_data(
            crop=crop, 
            state=state, 
            start_date=start_date, 
            end_date=end_date
        )
        return result
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error processing market data: {str(e)}")

@router.get("/forecast")
@cache_response(ttl_seconds=600, key_prefix="market_forecast")
def get_price_forecast(
    crop: str = Query("Wheat", description="Agricultural commodity name"),
    state: Optional[str] = Query(None, description="State (e.g., Punjab, Maharashtra)"),
    horizon_days: int = Query(14, ge=7, le=30, description="Forward forecast window in days")
):
    """
    ML Time-Series 7-day and 14-day forward price projection with upper/lower
    90% confidence bands and actionable 'Hold vs. Sell' advisory.
    """
    try:
        return price_forecast_service.get_price_forecast(
            commodity=crop,
            state=state,
            horizon_days=horizon_days
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating price forecast: {str(e)}")
