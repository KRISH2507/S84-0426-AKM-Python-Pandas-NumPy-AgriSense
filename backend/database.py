import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Dual-Mode: Default to local SQLite database in backend/data/, or connect to PostgreSQL via DATABASE_URL
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_SQLITE_PATH = DATA_DIR / "agrisense_production.db"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI dependency for managing database sessions per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes all database tables and seeds demo farmer profile if empty."""
    from models.db_models import Farmer, FarmPlot, TrackedSubsidy
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Seed default demo farmer if empty
        existing = db.query(Farmer).first()
        if not existing:
            demo_farmer = Farmer(
                name="Sardar Rajan Singh",
                email="farmer@agrisense.com",
                phone="+91 98765 43210",
                primary_state="Punjab",
                primary_district="Ludhiana",
                password_hash="demo_hashed_password"
            )
            db.add(demo_farmer)
            db.flush()

            # Add two default farm plots
            plot_1 = FarmPlot(
                farmer_id=demo_farmer.id,
                plot_name="Main Canal Plot (Paddy-Wheat)",
                crop="Wheat",
                season="Rabi",
                acres=3.5,
                soil_type="Alluvial Loam",
                lat=30.9010,
                lng=75.8573,
                irrigation_type="Canal + Tubewell"
            )
            plot_2 = FarmPlot(
                farmer_id=demo_farmer.id,
                plot_name="Eastern High-Ground Parcel",
                crop="Mustard",
                season="Rabi",
                acres=1.5,
                soil_type="Sandy Loam",
                lat=30.9150,
                lng=75.8720,
                irrigation_type="Drip Irrigation"
            )
            db.add_all([plot_1, plot_2])
            db.flush()

            # Seed one tracked subsidy application
            tracked = TrackedSubsidy(
                farmer_id=demo_farmer.id,
                scheme_id="pmksy_drip_02",
                scheme_title="PMKSY - Per Drop More Crop (Micro Irrigation Subsidy)",
                status="UNDER_REVIEW",
                application_ref_number="PB/PMKSY/2026/89412",
                applied_date="2026-08-15",
                notes="Submitted 7/12 land fard and quote from authorized Netafim dealer."
            )
            db.add(tracked)
            db.commit()
            print(f"[OK] Database initialized & seeded with default farmer ID: {demo_farmer.id}")
    except Exception as e:
        db.rollback()
        print(f"[WARN] Error initializing database: {e}")
    finally:
        db.close()
