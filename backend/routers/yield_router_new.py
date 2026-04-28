"""
Yield Prediction API Router

This module provides FastAPI endpoints for crop yield predictions using
ML models trained on historical agricultural data. It predicts crop yields
based on rainfall, fertilizer application, season, and soil conditions.

Endpoints:
    POST /api/yield-predict - Predict crop yield based on agricultural parameters

Services:
    - Leverages YieldService for ML model inference
    - Integrates Random Forest models for accurate predictions
    - Returns predictions with confidence metrics
"""

from fastapi import APIRouter
from schemas import YieldPredictRequest, YieldPredictResponse
from services.yield_service import yield_service

router = APIRouter(prefix="/api/yield-predict", tags=["Analytics & ML"])

@router.post("", response_model=YieldPredictResponse)
def predict_yield(request: YieldPredictRequest):
    """
    Predicts the expected crop yield per acre using our trained Random Forest model.
    
    Args:
        request: YieldPredictRequest containing crop parameters
        
    Returns:
        YieldPredictResponse with predicted yield and confidence metrics
    """
    result = yield_service.predict_yield(
        crop=request.crop,
        rainfall=request.rainfall_mm,
        fertilizer=request.fertilizer_pct,
        season=request.season,
        soil_type=request.soil_type,
        acres=request.field_acres
    )
    return result
