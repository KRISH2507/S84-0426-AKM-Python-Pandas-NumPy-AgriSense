from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from schemas import MandiListResponse, MandiArbitrageResponse
from services.mandi_pipeline import mandi_pipeline

router = APIRouter(prefix="/api/mandi", tags=["Mandi Live Wholesale Intelligence"])

@router.get("/rates", response_model=MandiListResponse)
def get_mandi_rates(
    state: Optional[str] = Query(None, description="Filter by Indian State (e.g., Punjab, Haryana)"),
    commodity: Optional[str] = Query(None, description="Filter by Commodity (e.g., Wheat, Rice, Tomato)"),
    district: Optional[str] = Query(None, description="Filter by District"),
    search: Optional[str] = Query(None, description="Search market name or commodity"),
    sort_by: Optional[str] = Query("modal_price_desc", description="Sort: modal_price_desc, modal_price_asc, arrivals_desc")
):
    """
    Returns live APMC Mandi wholesale prices (Min, Max, Modal, Arrivals in Tonnes, and 7-day sparkline).
    """
    try:
        return mandi_pipeline.get_mandi_rates(
            state=state,
            commodity=commodity,
            district=district,
            search=search,
            sort_by=sort_by
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch mandi rates: {str(e)}")

@router.get("/arbitrage", response_model=MandiArbitrageResponse)
def get_arbitrage_opportunity(
    commodity: str = Query("Wheat", description="Commodity to evaluate"),
    state: str = Query("Punjab", description="Target state")
):
    """
    Inter-Mandi Arbitrage Engine:
    Identifies price differentials across APMC markets to recommend the top-paying market in the state.
    """
    try:
        return mandi_pipeline.get_arbitrage_opportunity(commodity=commodity, state=state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate arbitrage: {str(e)}")

@router.post("/sync")
def sync_mandi_rates():
    """
    Triggers an on-demand synchronization with the daily Agmarknet market arrival feed.
    """
    try:
        return mandi_pipeline.sync_daily_rates()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync mandi rates: {str(e)}")
