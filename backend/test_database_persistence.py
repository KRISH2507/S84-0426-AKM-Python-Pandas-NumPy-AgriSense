import os
import sys
from database import init_db, SessionLocal
from models.db_models import Farmer, FarmPlot, TrackedSubsidy
from services.farmer_service import farmer_service
from schemas import FarmerRegisterRequest, FarmPlotCreate, TrackedSubsidyCreate

def test_database():
    print("Initializing database...")
    init_db()
    
    db = SessionLocal()
    try:
        # 1. Query demo farmer
        demo = db.query(Farmer).first()
        assert demo is not None, "Demo farmer not found in database!"
        print(f"[OK] Demo farmer found: {demo.name} ({demo.email})")
        print(f"     Plots count: {len(demo.plots)}")
        for p in demo.plots:
            print(f"       - Plot '{p.plot_name}': {p.acres} acres of {p.crop} ({p.season})")
        print(f"     Tracked subsidies: {len(demo.tracked_subsidies)}")
        for s in demo.tracked_subsidies:
            print(f"       - [{s.status}] {s.scheme_title} (Ref: {s.application_ref_number})")

        # 2. Test registering a second farmer
        test_email = "gurpreet.singh@farm.in"
        existing_test = db.query(Farmer).filter(Farmer.email == test_email).first()
        if existing_test:
            db.delete(existing_test)
            db.commit()

        new_farmer = farmer_service.register_farmer(db, FarmerRegisterRequest(
            name="Gurpreet Singh",
            email=test_email,
            password="secure_password_123",
            primary_state="Punjab",
            primary_district="Amritsar",
            initial_crop="Rice",
            initial_acres=4.0
        ))
        print(f"[OK] Registered new farmer ID {new_farmer.id}: {new_farmer.name}")

        # 3. Add second plot to Gurpreet
        plot_b = farmer_service.add_plot(db, new_farmer.id, FarmPlotCreate(
            plot_name="Tubewell Plot B",
            crop="Sugarcane",
            season="Annual",
            acres=2.5,
            soil_type="Clayey Loam"
        ))
        print(f"[OK] Added second plot ID {plot_b.id}: {plot_b.plot_name} ({plot_b.acres} acres)")

        # 4. Verify total acreage calculation
        profile = farmer_service.get_farmer_profile(db, new_farmer.id)
        assert profile["total_acres"] == 6.5, f"Expected 6.5 acres, got {profile['total_acres']}"
        print(f"[OK] Multi-plot total acreage correctly aggregated: {profile['total_acres']} acres")

        # 5. Track a subsidy for Gurpreet
        tracked = farmer_service.track_subsidy(db, new_farmer.id, TrackedSubsidyCreate(
            scheme_id="pb_dsr_incentive_05",
            scheme_title="Punjab DSR (Direct Seeding of Rice) Incentive",
            status="APPLIED",
            application_ref_number="PB/DSR/2026/1029",
            applied_date="2026-09-10",
            notes="Submitted fard and geo-tag proof."
        ))
        print(f"[OK] Tracked subsidy for new farmer: {tracked.scheme_title} - Status: {tracked.status}")

        print("\nAll database persistence checks passed with 100% success!")
    finally:
        db.close()

if __name__ == "__main__":
    test_database()
