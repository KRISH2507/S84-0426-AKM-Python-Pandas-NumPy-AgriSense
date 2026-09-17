from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from schemas import (
    RecommendedSubsidiesResponse,
    AllSubsidiesResponse,
    IngestSchemeRequest,
    IngestSchemeResponse
)
from services.scheme_service import scheme_service
from services.ingestion_service import ingestion_service

router = APIRouter(prefix="/api/subsidies", tags=["Subsidies & Protection"])

@router.get("/recommended", response_model=RecommendedSubsidiesResponse)
def get_recommended_subsidies(
    state: str = Query("Punjab", description="Farmer state location"),
    crop: str = Query("Wheat", description="Primary crop"),
    acres: float = Query(3.0, ge=0.1, description="Total farm acreage"),
    season: Optional[str] = Query(None, description="Current cropping season")
):
    """
    Returns personalized, eligible government subsidies filtered deterministically
    by state, crop, and farmer landholding category (Marginal/Small/Large).
    """
    try:
        results = scheme_service.get_recommended_schemes(
            state=state,
            crop=crop,
            acres=acres,
            season=season
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate eligible subsidies: {str(e)}")

@router.get("/all", response_model=AllSubsidiesResponse)
def get_all_subsidies():
    """
    Returns the complete catalog of active and historical government subsidies.
    """
    try:
        return scheme_service.get_all_schemes()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve scheme database: {str(e)}")

@router.post("/ingest", response_model=IngestSchemeResponse)
async def ingest_new_scheme(request: IngestSchemeRequest):
    """
    Dynamic Ingestion Engine:
    Ingests a newly announced government subsidy from raw press release text or JSON,
    parses & validates fields using Groq LLM, and updates the living database in real time.
    """
    try:
        result = await ingestion_service.ingest_announcement(
            text_announcement=request.text_announcement,
            scheme_json=request.scheme_json,
            source_url=request.source_url
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")
