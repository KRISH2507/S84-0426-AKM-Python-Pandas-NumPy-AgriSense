"""
Database connection module — SQLAlchemy + Neon PostgreSQL.

This module handles database initialization, engine creation, and session management
for the AgriSense application. It provides FastAPI dependencies for database access.
"""

import os
from typing import Generator
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from app.models import Base

load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./agrisense_dev.db")

engine: Engine = create_engine(DATABASE_URL)
SessionLocal: sessionmaker = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a DB session for request handling.
    
    Usage:
        @app.get("/")
        def read_root(db: Session = Depends(get_db)):
            ...
    """
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create all database tables based on SQLAlchemy models.
    
    This should be called once during application startup or deployment.
    """
    Base.metadata.create_all(bind=engine)
