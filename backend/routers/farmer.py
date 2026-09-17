from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    FarmerRegisterRequest,
    FarmerLoginRequest,
    FarmerUpdateRequest,
    FarmerResponse,
    FarmPlotCreate,
    FarmPlotResponse,
    TrackedSubsidyCreate,
    TrackedSubsidyUpdate,
    TrackedSubsidyResponse
)
from services.farmer_service import farmer_service

router = APIRouter(prefix="/api/farmer", tags=["Farmer Profile & Plots"])

@router.post("/register", response_model=FarmerResponse)
def register_farmer(request: FarmerRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new farmer account and persists it in the database."""
    try:
        farmer = farmer_service.register_farmer(db, request)
        profile = farmer_service.get_farmer_profile(db, farmer.id)
        return profile
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register farmer: {str(e)}")

@router.post("/login", response_model=FarmerResponse)
def login_farmer(request: FarmerLoginRequest, db: Session = Depends(get_db)):
    """Authenticates farmer and returns their persistent profile with all plots and tracked subsidies."""
    farmer = farmer_service.authenticate_farmer(db, request.email, request.password)
    if not farmer:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    profile = farmer_service.get_farmer_profile(db, farmer.id)
    return profile

@router.get("/profile/{farmer_id}", response_model=FarmerResponse)
def get_profile(farmer_id: int, db: Session = Depends(get_db)):
    """Fetches complete profile for a farmer by ID."""
    profile = farmer_service.get_farmer_profile(db, farmer_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    return profile

@router.put("/profile/{farmer_id}", response_model=FarmerResponse)
def update_profile(farmer_id: int, request: FarmerUpdateRequest, db: Session = Depends(get_db)):
    """Updates basic farmer contact and state information."""
    farmer = farmer_service.update_farmer(db, farmer_id, request)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    return farmer_service.get_farmer_profile(db, farmer_id)

# --- Plot Endpoints ---
@router.post("/{farmer_id}/plots", response_model=FarmPlotResponse)
def add_farm_plot(farmer_id: int, request: FarmPlotCreate, db: Session = Depends(get_db)):
    """Adds a new agricultural plot to the farmer's portfolio."""
    farmer = farmer_service.get_farmer_profile(db, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    plot = farmer_service.add_plot(db, farmer_id, request)
    return plot

@router.delete("/{farmer_id}/plots/{plot_id}")
def delete_farm_plot(farmer_id: int, plot_id: int, db: Session = Depends(get_db)):
    """Deletes a farm plot."""
    success = farmer_service.delete_plot(db, farmer_id, plot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Plot not found.")
    return {"success": True, "message": "Farm plot successfully deleted."}

# --- Tracked Subsidies Endpoints ---
@router.post("/{farmer_id}/subsidies/track", response_model=TrackedSubsidyResponse)
def track_subsidy(farmer_id: int, request: TrackedSubsidyCreate, db: Session = Depends(get_db)):
    """Saves or updates a subsidy application status for the farmer."""
    farmer = farmer_service.get_farmer_profile(db, farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    tracked = farmer_service.track_subsidy(db, farmer_id, request)
    return tracked

@router.put("/{farmer_id}/subsidies/{track_id}", response_model=TrackedSubsidyResponse)
def update_tracked_subsidy(farmer_id: int, track_id: int, request: TrackedSubsidyUpdate, db: Session = Depends(get_db)):
    """Updates the status or notes of an existing tracked subsidy."""
    tracked = farmer_service.update_tracked_subsidy(db, farmer_id, track_id, request)
    if not tracked:
        raise HTTPException(status_code=404, detail="Tracked subsidy record not found.")
    return tracked
