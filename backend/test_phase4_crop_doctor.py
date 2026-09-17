"""
Phase 4 Automated Verification Suite:
Smart Crop Doctor (AI Pest & Disease Diagnostic Engine) and Hyperlocal Climate Early Warning System.
"""

import sys
import os

# Set UTF-8 encoding for Windows terminals
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from services.crop_doctor_service import crop_doctor_service
from services.climate_service import climate_service

def test_crop_doctor_diagnostics():
    print("\n--- 1. Testing Crop Doctor Diagnostics Engine ---")
    
    # Test 1: Wheat Stripe Rust
    wheat_results = crop_doctor_service.diagnose(
        crop="Wheat",
        affected_part="leaf",
        symptoms=["yellow_spots", "rust_pustules", "stripes"]
    )
    assert len(wheat_results) > 0, "Wheat diagnosis returned 0 results"
    top_wheat = wheat_results[0]
    print(f"[OK] Wheat Diagnosis: {top_wheat['disease']['common_name']} ({top_wheat['disease']['scientific_name']})")
    print(f"     Match Confidence: {top_wheat['confidence_pct']}%")
    print(f"     Chemical Control: {top_wheat['disease']['chemical_control']['active_ingredient']} ({top_wheat['disease']['chemical_control']['brand_examples']})")
    assert "yellow-rust" in top_wheat["disease"]["id"], f"Expected yellow-rust, got {top_wheat['disease']['id']}"
    assert top_wheat["confidence_pct"] >= 70, "Confidence should be >= 70%"

    # Test 2: Tomato Late Blight
    tomato_results = crop_doctor_service.diagnose(
        crop="Tomato",
        affected_part="leaf",
        symptoms=["water_soaked_spots", "white_mold_underside", "black_rot"]
    )
    assert len(tomato_results) > 0, "Tomato diagnosis returned 0 results"
    top_tomato = tomato_results[0]
    print(f"[OK] Tomato Diagnosis: {top_tomato['disease']['common_name']}")
    print(f"     Match Confidence: {top_tomato['confidence_pct']}%")
    print(f"     CIBRC Active Ingredient: {top_tomato['disease']['chemical_control']['active_ingredient']}")
    assert "tomato-late-blight" in top_tomato["disease"]["id"], f"Expected tomato-late-blight, got {top_tomato['disease']['id']}"

    # Test 3: Cotton Pink Bollworm
    cotton_results = crop_doctor_service.diagnose(
        crop="Cotton",
        affected_part="fruit",
        symptoms=["holes", "rosette_flower", "stained_lint"]
    )
    assert len(cotton_results) > 0, "Cotton diagnosis returned 0 results"
    top_cotton = cotton_results[0]
    print(f"[OK] Cotton Diagnosis: {top_cotton['disease']['common_name']}")
    print(f"     Match Confidence: {top_cotton['confidence_pct']}%")
    assert "cotton-pink-bollworm" in top_cotton["disease"]["id"], f"Expected cotton-pink-bollworm, got {top_cotton['disease']['id']}"

def test_acreage_dosage_calculator():
    print("\n--- 2. Testing Acreage Dosage Calculator ---")
    
    # Calculate for 3.5 acres of Tomato Late Blight
    dosage = crop_doctor_service.calculate_dosage(
        disease_id="tomato-late-blight",
        acres=3.5,
        spray_liters_per_acre=200.0
    )
    print(f"[OK] Calculated Dosage for {dosage['acres']} Acres:")
    print(f"     Total Spray Water: {dosage['total_spray_water_liters']} Liters")
    print(f"     Knapsack Sprayer Tanks (15L): {dosage['knapsack_tanks_15L']} tanks")
    print(f"     Battery Sprayer Tanks (20L): {dosage['battery_tanks_20L']} tanks")
    print(f"     Active Ingredient: {dosage['active_ingredient']}")
    print(f"     Dilution Rate: {dosage['dose_per_liter']}")
    print(f"     Pre-Harvest Interval: {dosage['phi_days']} Days")
    
    assert dosage["total_spray_water_liters"] == 700.0
    assert dosage["knapsack_tanks_15L"] == 47
    assert dosage["battery_tanks_20L"] == 35

def test_climate_forecast_and_spray_advisor():
    print("\n--- 3. Testing 10-Day Climate Forecast & Spray Window Advisor ---")
    
    # Ludhiana, Punjab coordinates
    forecast = climate_service.get_10_day_forecast(lat=30.9010, lon=75.8573, crop="Wheat")
    daily = forecast["daily"]
    print(f"[OK] Forecast generated for {forecast['crop']} across {forecast['forecast_days']} days.")
    print(f"     Optimal Spray Days: {forecast['optimal_spray_days']}")
    
    assert len(daily) == 10, "Should generate exactly 10 days of forecast"
    first_day = daily[0]
    assert "temp_range" in first_day
    assert "spray_window" in first_day
    print(f"     Day 1 ({first_day['day_name']} {first_day['full_date']}): Temp {first_day['temp_range']}, Rain: {first_day['precipitation_mm']}mm ({first_day['rain_probability']}%), Spray Window: [{first_day['spray_window']['status']}] - {first_day['spray_window']['note']}")

def test_field_hazard_alerts():
    print("\n--- 4. Testing Field Hazard Alerts & Multi-Channel Dispatch ---")
    
    alerts_data = climate_service.get_active_field_alerts(
        lat=30.9010,
        lon=75.8573,
        crop="Wheat",
        state="Punjab"
    )
    alerts = alerts_data["alerts"]
    print(f"[OK] Total Field Alerts Detected: {alerts_data['total_alerts']}")
    for a in alerts:
        print(f"     [{a['urgency']}] {a['title']} - Category: {a['category']}")
        print(f"       Action: {a['action']}")
    
    print(f"\n[OK] Simulated SMS Dispatch Payload:")
    print(f"     \"{alerts_data['sms_dispatch_payload']}\"")
    
    assert alerts_data["total_alerts"] > 0, "Should detect field hazard alerts"
    assert len(alerts_data["sms_dispatch_payload"]) > 10

if __name__ == "__main__":
    print("==================================================")
    print("RUNNING PHASE 4 AUTOMATED TEST SUITE")
    print("==================================================")
    test_crop_doctor_diagnostics()
    test_acreage_dosage_calculator()
    test_climate_forecast_and_spray_advisor()
    test_field_hazard_alerts()
    print("\n[SUCCESS] All Phase 4 backend services verified successfully!")
