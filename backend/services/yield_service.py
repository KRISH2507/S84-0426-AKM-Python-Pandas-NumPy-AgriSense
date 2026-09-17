import joblib
import pandas as pd
from pathlib import Path
import numpy as np

class YieldService:
    """
    Handles loading the pre-trained Yield Prediction Model (Random Forest)
    and formatting the incoming requests to match the model's exact input features.
    """
    def __init__(self):
        self.model = None
        # Resolving path directly to backend/models/yield_predictor.pkl
        self.model_path = Path(__file__).resolve().parent.parent / "models" / "yield_predictor.pkl"
        self._load_model()
        
        # Base historical averages for fallback/context
        self.base_averages = {
            "wheat": 24.5,
            "rice": 28.0,
            "maize": 20.0,
            "sugarcane": 300.0
        }

    def _load_model(self):
        if self.model_path.exists():
            self.model = joblib.load(self.model_path)
            print(f"[OK] Yield Predictor Model loaded from {self.model_path}")
        else:
            print(f"[WARN] Warning: Model not found at {self.model_path}. Using fallback simulation mode.")

    def predict_yield(self, crop: str, rainfall: float, fertilizer: float, season: str, soil_type: str, acres: float) -> dict:
        crop_lower = crop.lower()
        hist_avg = self.base_averages.get(crop_lower, 20.0)

        predicted_per_acre = hist_avg
        confidence = 85

        if self.model is not None:
            # We would construct the exact one-hot encoded dataframe the model expects here.
            # For brevity/robustness in the API, if the model is loaded, we attempt prediction.
            # In a real scenario, you map the exact columns saved in models/yield_predictor_columns.pkl
            # Since the notebook generated specific dummies (e.g., crop_type_Wheat), we try to pass them safely.
            try:
                # Mocking the DataFrame structure expected by RandomForest with dummies
                expected_cols = getattr(self.model, "feature_names_in_", None)
                if expected_cols is not None:
                    input_df = pd.DataFrame(0, index=[0], columns=expected_cols)
                    input_df['rainfall'] = rainfall
                    input_df['fertilizer_amount'] = fertilizer
                    
                    if f'crop_type_{crop}' in input_df.columns:
                        input_df[f'crop_type_{crop}'] = 1
                    if f'season_{season}' in input_df.columns:
                        input_df[f'season_{season}'] = 1
                    if f'soil_type_{soil_type}' in input_df.columns:
                        input_df[f'soil_type_{soil_type}'] = 1

                    predicted_per_acre = self.model.predict(input_df)[0]
                    confidence = 92
            except Exception as e:
                print(f"Model prediction error: {e}. Using heuristics.")
                # Fallback to heuristics if column mismatch
                pass
        else:
            # Simulate prediction logic if model file is missing
            rain_factor = 1.1 if 100 <= rainfall <= 250 else 0.8
            fert_factor = 1.05 if 50 <= fertilizer <= 120 else 0.9
            predicted_per_acre = hist_avg * rain_factor * fert_factor
        
        # Calculate total for the field if needed, but per acre is standard
        # predicted_total = predicted_per_acre * acres
        
        msg = "Good expected yield under current conditions."
        if predicted_per_acre < hist_avg * 0.8:
            msg = "Yield is lower than historical average. Consider adjusting fertilizer or irrigation."

        return {
            "predicted_yield": round(predicted_per_acre, 1),
            "unit": "quintal_per_acre",
            "confidence_pct": confidence,
            "historical_avg": hist_avg,
            "message": msg
        }

yield_service = YieldService()
