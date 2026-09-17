"""
Phase 5 Automated Verification Suite:
Dual-Mode Caching Service, Mandi Price Forecasting ML, and Ensemble Yield Model.
"""

import sys
import time

# Set UTF-8 encoding for Windows terminals
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from services.cache_service import cache_service
from services.price_forecast_service import price_forecast_service
from services.yield_service import yield_service

def test_dual_mode_caching():
    print("\n--- 1. Testing Dual-Mode Caching Engine ---")
    
    # Verify status
    status = cache_service.get_status()
    print(f"[OK] Cache Active Mode: {status['mode']}")
    print(f"     Redis Connected:   {status['redis_connected']}")
    print(f"     In-Memory Keys:    {status['in_memory_stats']['total_keys']}")

    # Set and Get
    test_key = "kisan_cache_test"
    payload = {"mandi": "Khanna Mandi", "modal_price": 2520.0, "timestamp": time.time()}
    cache_service.set(test_key, payload, ttl_seconds=2)
    
    cached = cache_service.get(test_key)
    assert cached is not None, "Cache get returned None"
    assert cached["mandi"] == "Khanna Mandi"
    print(f"[OK] Cached Item Retrieved: {cached['mandi']} @ Rs. {cached['modal_price']}")

    # Test TTL expiration
    time.sleep(2.1)
    expired = cache_service.get(test_key)
    assert expired is None, "Cache item should have expired after TTL"
    print("[OK] TTL Expiration Verified: Stale item purged automatically.")

def test_price_forecasting_ml():
    print("\n--- 2. Testing Mandi Price Forecasting ML Engine ---")

    test_crops = ["Wheat", "Tomato", "Cotton", "Onion"]
    for crop in test_crops:
        forecast = price_forecast_service.get_price_forecast(commodity=crop, state="Punjab", horizon_days=14)
        
        assert forecast["commodity"] == crop
        assert len(forecast["projections"]) == 14, f"Expected 14 projection points for {crop}"
        
        p7 = forecast["forecast_7d"]
        p14 = forecast["forecast_14d"]
        advisory = forecast["trade_advisory"]

        print(f"[OK] {crop.upper()} Price Forecast:")
        print(f"     Current Base Price: Rs. {forecast['current_price']:.1f}/Qtl")
        print(f"     7-Day Projection:   Rs. {p7['predicted_price']:.1f} ({p7['change_inr']:+.1f} INR, {p7['change_pct']:+.2f}%)")
        print(f"     14-Day Projection:  Rs. {p14['predicted_price']:.1f} ({p14['change_inr']:+.1f} INR, {p14['change_pct']:+.2f}%)")
        print(f"     Trade Advisory:     [{advisory['badge']}] {advisory['recommendation'][:110]}...")

        # Verify confidence corridors
        first_proj = forecast["projections"][0]
        assert first_proj["upper_bound_90pct"] >= first_proj["predicted_price"] >= first_proj["lower_bound_90pct"], \
            "Confidence bound violation"

def test_ensemble_yield_model():
    print("\n--- 3. Testing Ensemble Yield Model Production Inference ---")

    cases = [
        {"crop": "Wheat", "rainfall": 110.0, "fertilizer": 80.0, "season": "Rabi", "soil": "Alluvial", "acres": 4.0},
        {"crop": "Rice", "rainfall": 320.0, "fertilizer": 95.0, "season": "Kharif", "soil": "Clay", "acres": 5.0},
        {"crop": "Tomato", "rainfall": 150.0, "fertilizer": 85.0, "season": "Rabi", "soil": "Loam", "acres": 2.0},
    ]

    for c in cases:
        res = yield_service.predict_yield(
            crop=c["crop"],
            rainfall=c["rainfall"],
            fertilizer=c["fertilizer"],
            season=c["season"],
            soil_type=c["soil"],
            acres=c["acres"]
        )
        print(f"[OK] {c['crop']} Prediction ({c['acres']} acres, {c['soil']} soil):")
        print(f"     Expected Yield: {res['predicted_yield']:.1f} {res['unit']}")
        print(f"     Confidence:     {res['confidence_pct']}% (Historical Avg: {res['historical_avg']} Qtl/acre)")
        assert res["predicted_yield"] > 0, "Yield prediction must be positive"
        assert res["confidence_pct"] >= 80, "Confidence should be >= 80%"

if __name__ == "__main__":
    print("==================================================")
    print("RUNNING PHASE 5 AUTOMATED VERIFICATION SUITE")
    print("==================================================")
    test_dual_mode_caching()
    test_price_forecasting_ml()
    test_ensemble_yield_model()
    print("\n[SUCCESS] All Phase 5 tests passed successfully!")
