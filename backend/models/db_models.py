import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Farmer(Base):
    """Core Farmer Account table."""
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(25), nullable=True)
    password_hash = Column(String(255), nullable=False)
    primary_state = Column(String(80), nullable=False, default="Punjab")
    primary_district = Column(String(80), nullable=True, default="Ludhiana")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    plots = relationship("FarmPlot", back_populates="farmer", cascade="all, delete-orphan")
    tracked_subsidies = relationship("TrackedSubsidy", back_populates="farmer", cascade="all, delete-orphan")
    yield_logs = relationship("HarvestYieldLog", back_populates="farmer", cascade="all, delete-orphan")

class FarmPlot(Base):
    """Multiple agricultural parcels owned or managed by a farmer."""
    __tablename__ = "farm_plots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    plot_name = Column(String(120), nullable=False, default="My Farm Plot")
    crop = Column(String(60), nullable=False, default="Wheat")
    season = Column(String(30), nullable=False, default="Rabi")
    acres = Column(Float, nullable=False, default=3.0)
    soil_type = Column(String(80), nullable=True, default="Alluvial Loam")
    lat = Column(Float, nullable=True, default=30.9010)
    lng = Column(Float, nullable=True, default=75.8573)
    irrigation_type = Column(String(80), nullable=True, default="Canal + Tubewell")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farmer = relationship("Farmer", back_populates="plots")

class TrackedSubsidy(Base):
    """Subsidy applications saved or applied for by the farmer."""
    __tablename__ = "tracked_subsidies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    scheme_id = Column(String(80), nullable=False)
    scheme_title = Column(String(200), nullable=False)
    status = Column(String(40), nullable=False, default="BOOKMARKED") # BOOKMARKED, APPLIED, UNDER_REVIEW, DISBURSED
    application_ref_number = Column(String(100), nullable=True)
    applied_date = Column(String(40), nullable=True)
    disbursement_amount_inr = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    farmer = relationship("Farmer", back_populates="tracked_subsidies")

class HarvestYieldLog(Base):
    """Historical harvest reports to track farm productivity and ML drift."""
    __tablename__ = "harvest_yield_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    plot_id = Column(Integer, ForeignKey("farm_plots.id", ondelete="SET NULL"), nullable=True)
    crop = Column(String(60), nullable=False)
    year = Column(Integer, nullable=False)
    season = Column(String(30), nullable=False)
    actual_yield_qtl = Column(Float, nullable=False)
    predicted_yield_qtl = Column(Float, nullable=True)
    selling_price_per_qtl = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farmer = relationship("Farmer", back_populates="yield_logs")
