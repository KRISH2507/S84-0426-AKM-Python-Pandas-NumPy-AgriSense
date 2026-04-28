"""
Market Data API Router

This module provides FastAPI endpoints for accessing agricultural market data,
including crop prices, volatility metrics, and historical trends.

Endpoints:
    GET /api/market-data - Fetch comprehensive market data for a specific crop

Services:
    - Leverages DataService for data retrieval and feature engineering
    - Integrates with SQLAlchemy ORM for database operations
    - Returns standardized MarketDataResponse schema for frontend consumption
"""

from fastapi import APIRouter, Query, HTTPException
from schemas import MarketDataResponse
from services.data_service import data_service

# Create an APIRouter for all Market-related endpoints
router = APIRouter(prefix="/api/market-data", tags=["Market Dashboard"])

@router.get("", response_model=MarketDataResponse)
def fetch_market_data(
    crop: str = Query(..., description="Crop name to fetch data for (e.g., 'Wheat', 'Tomato', 'Rice')"),
    state: str = Query(None, description="Filter prices by specific state (Optional)"),
    start_date: str = Query(None, description="Start date in YYYY-MM-DD format (Optional)"),
    end_date: str = Query(None, description="End date in YYYY-MM-DD format (Optional)")
):
    """
    Get comprehensive market data for a specific crop.
    This powers the main tiles and charts on the React Market Dashboard.
    
    It returns:
    - Latest Prices
    - Engineered Features (Volatility, Rolling Averages)
    - 30-day historical array for front-end charting
    """
    try:
        # Offload all the heavy lifting and business logic to our Data Service!
        # Notice how clean and readable this route handler is.
        result = data_service.get_market_data(
            crop=crop, 
            state=state, 
            start_date=start_date, 
            end_date=end_date
        )
        return result
        
    except HTTPException as he:
        # Re-raise known API errors (like 404 Crop Not Found)
        raise he
    except Exception as e:
        # Catch unexpected pandas or python errors and return 500
        raise HTTPException(status_code=500, detail=f"Internal Server Error processing market data: {str(e)}")
