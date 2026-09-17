import hashlib
from typing import Optional, List
from sqlalchemy.orm import Session
from models.db_models import Farmer, FarmPlot, TrackedSubsidy
from schemas import FarmerRegisterRequest, FarmerUpdateRequest, FarmPlotCreate, TrackedSubsidyCreate, TrackedSubsidyUpdate

class FarmerService:
    """Service layer managing database operations for Farmers, Farm Plots, and Tracked Subsidies."""

    @staticmethod
    def hash_password(password: str) -> str:
        """Secure SHA-256 hash with custom salt for lightweight production operation."""
        salt = "agrisense_salt_2026"
        return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()

    def register_farmer(self, db: Session, data: FarmerRegisterRequest) -> Farmer:
        """Registers a new farmer in database and initializes their first farm plot."""
        existing = db.query(Farmer).filter(Farmer.email == data.email.lower().strip()).first()
        if existing:
            raise ValueError(f"An account with email '{data.email}' already exists.")

        farmer = Farmer(
            name=data.name.strip(),
            email=data.email.lower().strip(),
            phone=data.phone.strip() if data.phone else None,
            password_hash=self.hash_password(data.password),
            primary_state=data.primary_state,
            primary_district=data.primary_district
        )
        db.add(farmer)
        db.flush()

        # Initialize initial farm parcel
        initial_plot = FarmPlot(
            farmer_id=farmer.id,
            plot_name="Main Parcel",
            crop=data.initial_crop or "Wheat",
            season="Rabi",
            acres=data.initial_acres or 3.0,
            soil_type="Alluvial Loam"
        )
        db.add(initial_plot)
        db.commit()
        db.refresh(farmer)
        return farmer

    def authenticate_farmer(self, db: Session, email: str, password: str) -> Optional[Farmer]:
        """Authenticates farmer credentials."""
        clean_email = email.lower().strip()
        farmer = db.query(Farmer).filter(Farmer.email == clean_email).first()
        if not farmer:
            return None
        
        # Check password hash (or allow demo fallback for Sardar Rajan)
        if farmer.password_hash == self.hash_password(password) or farmer.password_hash == "demo_hashed_password":
            return farmer
        return None

    def get_farmer_profile(self, db: Session, farmer_id: int) -> Optional[dict]:
        """Retrieves complete profile with calculated total acreage and active plots."""
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            return None

        total_acres = sum(p.acres for p in farmer.plots) if farmer.plots else 0.0

        return {
            "id": farmer.id,
            "name": farmer.name,
            "email": farmer.email,
            "phone": farmer.phone,
            "primary_state": farmer.primary_state,
            "primary_district": farmer.primary_district,
            "total_acres": round(total_acres, 2),
            "plots": farmer.plots,
            "tracked_subsidies": farmer.tracked_subsidies,
            "created_at": farmer.created_at
        }

    def update_farmer(self, db: Session, farmer_id: int, data: FarmerUpdateRequest) -> Optional[Farmer]:
        farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
        if not farmer:
            return None

        if data.name:
            farmer.name = data.name.strip()
        if data.phone:
            farmer.phone = data.phone.strip()
        if data.primary_state:
            farmer.primary_state = data.primary_state.strip()
        if data.primary_district:
            farmer.primary_district = data.primary_district.strip()

        db.commit()
        db.refresh(farmer)
        return farmer

    # --- Plot Operations ---
    def add_plot(self, db: Session, farmer_id: int, data: FarmPlotCreate) -> FarmPlot:
        plot = FarmPlot(
            farmer_id=farmer_id,
            plot_name=data.plot_name,
            crop=data.crop,
            season=data.season,
            acres=data.acres,
            soil_type=data.soil_type,
            lat=data.lat,
            lng=data.lng,
            irrigation_type=data.irrigation_type
        )
        db.add(plot)
        db.commit()
        db.refresh(plot)
        return plot

    def delete_plot(self, db: Session, farmer_id: int, plot_id: int) -> bool:
        plot = db.query(FarmPlot).filter(FarmPlot.id == plot_id, FarmPlot.farmer_id == farmer_id).first()
        if not plot:
            return False
        db.delete(plot)
        db.commit()
        return True

    # --- Subsidy Application Operations ---
    def track_subsidy(self, db: Session, farmer_id: int, data: TrackedSubsidyCreate) -> TrackedSubsidy:
        # Check if already tracked
        existing = db.query(TrackedSubsidy).filter(
            TrackedSubsidy.farmer_id == farmer_id,
            TrackedSubsidy.scheme_id == data.scheme_id
        ).first()

        if existing:
            existing.status = data.status
            existing.application_ref_number = data.application_ref_number or existing.application_ref_number
            existing.applied_date = data.applied_date or existing.applied_date
            existing.notes = data.notes or existing.notes
            db.commit()
            db.refresh(existing)
            return existing

        tracked = TrackedSubsidy(
            farmer_id=farmer_id,
            scheme_id=data.scheme_id,
            scheme_title=data.scheme_title,
            status=data.status,
            application_ref_number=data.application_ref_number,
            applied_date=data.applied_date,
            disbursement_amount_inr=data.disbursement_amount_inr,
            notes=data.notes
        )
        db.add(tracked)
        db.commit()
        db.refresh(tracked)
        return tracked

    def update_tracked_subsidy(self, db: Session, farmer_id: int, track_id: int, data: TrackedSubsidyUpdate) -> Optional[TrackedSubsidy]:
        tracked = db.query(TrackedSubsidy).filter(
            TrackedSubsidy.id == track_id,
            TrackedSubsidy.farmer_id == farmer_id
        ).first()
        if not tracked:
            return None

        if data.status:
            tracked.status = data.status
        if data.application_ref_number is not None:
            tracked.application_ref_number = data.application_ref_number
        if data.applied_date is not None:
            tracked.applied_date = data.applied_date
        if data.disbursement_amount_inr is not None:
            tracked.disbursement_amount_inr = data.disbursement_amount_inr
        if data.notes is not None:
            tracked.notes = data.notes

        db.commit()
        db.refresh(tracked)
        return tracked

farmer_service = FarmerService()
