"""
AgriSense - Advanced Ensemble Crop Yield Model Trainer.
Trains and compares Random Forest and Gradient Boosting Regressors,
saving the best performing ensemble model to backend/models/yield_predictor.pkl.
"""

import sys
import os
from pathlib import Path

# Configure Windows console encoding safely
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, VotingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import joblib

def train_and_save_yield_model():
    print("=" * 65)
    print("[INFO] Training AgriSense Advanced Ensemble Crop Yield ML Model...")
    print("=" * 65)

    np.random.seed(42)
    n_samples = 4500

    crops = ['Wheat', 'Rice', 'Maize', 'Sugarcane', 'Soybean', 'Cotton', 'Tomato', 'Potato', 'Mustard', 'Chickpea', 'Onion']
    soils = ['Alluvial', 'Black', 'Red', 'Clay', 'Loam', 'Sandy']
    seasons = ['Kharif', 'Rabi', 'Zaid']

    yield_df = pd.DataFrame({
        'crop_type': np.random.choice(crops, n_samples),
        'soil_type': np.random.choice(soils, n_samples),
        'season': np.random.choice(seasons, n_samples),
        'rainfall': np.random.uniform(25, 480, n_samples),         # mm
        'fertilizer_amount': np.random.uniform(15, 160, n_samples) # kg/acre
    })

    # Realistic non-linear yield formulation based on agronomic Goldilocks zones
    def calculate_yield(row):
        base_yields = {
            'Wheat': 24.5, 'Rice': 28.5, 'Maize': 22.5, 'Sugarcane': 285.0,
            'Soybean': 14.5, 'Cotton': 12.5, 'Tomato': 88.0, 'Potato': 98.0,
            'Mustard': 16.5, 'Chickpea': 15.5, 'Onion': 78.0
        }
        base = base_yields.get(row['crop_type'], 20.0)

        # Fertilizer curve: optimal around 70-100 kg/acre
        fert = row['fertilizer_amount']
        fert_effect = 1.0 + (0.16 * (fert / 80.0)) if fert <= 90 else 1.16 - (0.11 * ((fert - 90) / 60.0))

        # Rain curve: crop specific optimal rainfall
        rain = row['rainfall']
        if row['crop_type'] == 'Rice':
            rain_effect = 1.0 + (0.28 * (rain / 300.0)) if rain <= 360 else 1.28 - (0.22 * ((rain - 360) / 100.0))
        elif row['crop_type'] in ['Wheat', 'Mustard', 'Chickpea']:
            rain_effect = 1.0 + (0.16 * (rain / 120.0)) if rain <= 150 else 1.16 - (0.26 * ((rain - 150) / 200.0))
        else:
            rain_effect = 1.0 + (0.16 * (rain / 180.0)) if rain <= 200 else 1.16 - (0.22 * ((rain - 200) / 200.0))

        # Soil synergy
        soil_mult = 1.08 if (row['soil_type'] in ['Alluvial', 'Black', 'Clay'] and row['crop_type'] in ['Wheat', 'Rice', 'Cotton']) else 0.96

        noise = np.random.normal(0, 1.2)
        total_yield = max(5.0, base * fert_effect * rain_effect * soil_mult + noise)
        return round(total_yield, 2)

    yield_df['yield_quintal_per_acre'] = yield_df.apply(calculate_yield, axis=1)

    # One-hot encoding
    X = pd.get_dummies(yield_df.drop('yield_quintal_per_acre', axis=1), drop_first=False)
    y = yield_df['yield_quintal_per_acre']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 1. Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=120, max_depth=14, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    rf_pred = rf.predict(X_test)
    rf_r2 = r2_score(y_test, rf_pred)
    rf_mae = mean_absolute_error(y_test, rf_pred)

    # 2. Gradient Boosting Regressor
    gb = GradientBoostingRegressor(n_estimators=100, max_depth=6, learning_rate=0.08, random_state=42)
    gb.fit(X_train, y_train)
    gb_pred = gb.predict(X_test)
    gb_r2 = r2_score(y_test, gb_pred)
    gb_mae = mean_absolute_error(y_test, gb_pred)

    # 3. Ensemble Voting Regressor (Weighted combination)
    ensemble = VotingRegressor(estimators=[('rf', rf), ('gb', gb)], weights=[1.0, 1.0])
    ensemble.fit(X_train, y_train)
    ensemble_pred = ensemble.predict(X_test)
    ensemble_r2 = r2_score(y_test, ensemble_pred)
    ensemble_mae = mean_absolute_error(y_test, ensemble_pred)
    ensemble_rmse = np.sqrt(mean_squared_error(y_test, ensemble_pred))

    print(f"[METRIC] Random Forest R2:       {rf_r2:.4f} (MAE: {rf_mae:.2f} Qtl)")
    print(f"[METRIC] Gradient Boosting R2:  {gb_r2:.4f} (MAE: {gb_mae:.2f} Qtl)")
    print(f"[METRIC] Ensemble Model R2:     {ensemble_r2:.4f} (MAE: {ensemble_mae:.2f} Qtl, RMSE: {ensemble_rmse:.2f})")
    print(f"[METRIC] Variance Explained:    {(ensemble_r2 * 100):.1f}%")

    # Set feature names on ensemble for production inference compatibility
    ensemble.feature_names_in_ = X_train.columns.values

    # Top Feature Importances from Random Forest component
    importances = pd.Series(rf.feature_importances_, index=X_train.columns).sort_values(ascending=False)
    print("\n[INFO] Top 5 Agronomic Feature Importances:")
    for feat, imp in importances.head(5).items():
        print(f"       - {feat}: {(imp * 100):.1f}%")

    # Save best ensemble model
    models_dir = Path(__file__).resolve().parent / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    model_path = models_dir / "yield_predictor.pkl"

    joblib.dump(ensemble, model_path)
    print(f"\n[SAVED] Ensemble Model successfully saved to: {model_path}")

    # Test sample inference
    sample = pd.DataFrame(0, index=[0], columns=ensemble.feature_names_in_)
    sample['rainfall'] = 110.0
    sample['fertilizer_amount'] = 80.0
    if 'crop_type_Wheat' in sample.columns:
        sample['crop_type_Wheat'] = 1
    if 'soil_type_Alluvial' in sample.columns:
        sample['soil_type_Alluvial'] = 1
    if 'season_Rabi' in sample.columns:
        sample['season_Rabi'] = 1

    test_pred = ensemble.predict(sample)[0]
    print(f"[TEST] Predicted Yield (Wheat, Rabi, Alluvial, 110mm rain, 80kg fert): {test_pred:.1f} quintals/acre")
    print("=" * 65)

if __name__ == "__main__":
    train_and_save_yield_model()
