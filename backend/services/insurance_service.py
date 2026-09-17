import json
from pathlib import Path
from typing import Dict, Any, Optional
from services.data_service import data_service
from services.yield_service import yield_service
from services.climate_service import climate_service

class InsuranceService:
    """
    Computes dynamic, real-time crop insurance quotes under PMFBY / WBCIS rules,
    linking exact current Mandi commodity prices, yield forecasts, and statutory rate caps.
    """
    def __init__(self):
        self.store_path = Path(__file__).resolve().parent.parent / "data" / "insurance_store.json"
        self._cache = None
        
        # Benchmark MSP / statutory floor prices per quintal if mandi price is 0
        self.crop_msp_benchmarks = {
            "wheat": 2275.0,
            "rice": 2183.0,
            "maize": 2090.0,
            "cotton": 6620.0,
            "soybean": 4600.0,
            "mustard": 5650.0,
            "chickpea": 5440.0,
            "sugarcane": 315.0,
            "tomato": 1850.0,
            "potato": 1400.0,
            "onion": 1950.0
        }

    def _load_store(self) -> Dict[str, Any]:
        if not self.store_path.exists():
            return {
                "statutory_rules": {},
                "benchmark_actuarial_rate_pct": 10.5,
                "insurance_providers": [],
                "claim_triggers": []
            }
        with open(self.store_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def calculate_quote(
        self,
        crop: str,
        acres: float,
        state: Optional[str] = "Punjab",
        season: Optional[str] = None,
        custom_coverage_per_acre: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Dynamically calculates the exact Sum Insured, Farmer Premium,
        and Government Subsidy using live Mandi market rates.
        """
        store = self._load_store()
        crop_lower = crop.strip().lower()

        # 1. Fetch exact current Mandi market price from DataService
        mandi_info = data_service.get_market_data(crop=crop, state=state)
        current_price = mandi_info.get("current_price", 0.0)
        
        # If live price is zero/missing, fall back to statutory Minimum Support Price (MSP)
        if current_price <= 0.0:
            current_price = self.crop_msp_benchmarks.get(crop_lower, 2000.0)

        # 2. Fetch expected yield per acre from YieldService
        yield_info = yield_service.predict_yield(
            crop=crop,
            rainfall=150.0,
            fertilizer=50.0,
            season=season or "Rabi",
            soil_type="Alluvial",
            acres=acres
        )
        yield_per_acre = yield_info.get("predicted_yield", 20.0)

        # 3. Calculate Sum Insured (Scale of Finance / Crop Valuation)
        if custom_coverage_per_acre and custom_coverage_per_acre > 0:
            sum_insured_per_acre = custom_coverage_per_acre
        else:
            # Valuation = yield in quintals * price per quintal
            sum_insured_per_acre = round(yield_per_acre * current_price, 2)

        total_sum_insured = round(sum_insured_per_acre * acres, 2)

        # 4. Determine Statutory Farmer Premium Rate Cap (PMFBY rules)
        statutory_rules = store.get("statutory_rules", {})
        farmer_rate_pct = 2.0  # default
        detected_season = season or "Rabi"

        # Check Horticultural / Commercial
        hort_crops = [c.lower() for c in statutory_rules.get("annual_commercial_horticulture", {}).get("crops", [])]
        rabi_crops = [c.lower() for c in statutory_rules.get("rabi_food_oilseeds", {}).get("crops", [])]
        kharif_crops = [c.lower() for c in statutory_rules.get("kharif_food_oilseeds", {}).get("crops", [])]

        if crop_lower in hort_crops:
            farmer_rate_pct = 5.0
            detected_season = "Annual Commercial"
        elif crop_lower in rabi_crops or (season and season.lower() == "rabi"):
            farmer_rate_pct = 1.5
            detected_season = "Rabi"
        elif crop_lower in kharif_crops or (season and season.lower() == "kharif"):
            farmer_rate_pct = 2.0
            detected_season = "Kharif"

        # 5. Calculate Premiums
        actuarial_rate = store.get("benchmark_actuarial_rate_pct", 10.5)
        total_actuarial_premium = round(total_sum_insured * (actuarial_rate / 100.0), 2)
        
        # Farmer pays ONLY the legally capped rate
        farmer_premium = round(total_sum_insured * (farmer_rate_pct / 100.0), 2)
        
        # Government pays the difference as direct subsidy to insurance underwriters
        govt_subsidy = round(max(0.0, total_actuarial_premium - farmer_premium), 2)
        subsidy_pct = round((govt_subsidy / total_actuarial_premium * 100.0) if total_actuarial_premium > 0 else 80.0, 1)

        # 6. Climate Risk linkage
        climate_alert = None
        urgency = "Standard"
        try:
            risk_data = climate_service.get_climate_risk(crop=crop)
            score = risk_data.get("risk_score", 30)
            if score >= 50:
                climate_alert = f"High Weather Risk ({score}/100): Drought/heatwave risk predicted. Crop enrollment strongly advised."
                urgency = "High Urgency - Weather Threat Detected"
            else:
                climate_alert = f"Favorable Climate Risk ({score}/100): Optimal time for policy enrollment."
        except Exception:
            climate_alert = "Standard PMFBY Enrollment Window Active."

        return {
            "crop": crop,
            "season": detected_season,
            "state": state or "Punjab",
            "acres": acres,
            "current_mandi_price_per_quintal": round(current_price, 2),
            "estimated_yield_quintal_per_acre": round(yield_per_acre, 1),
            "sum_insured_per_acre": sum_insured_per_acre,
            "total_sum_insured": total_sum_insured,
            "farmer_rate_pct": farmer_rate_pct,
            "farmer_premium_payable": farmer_premium,
            "government_subsidy_amount": govt_subsidy,
            "total_actuarial_premium": total_actuarial_premium,
            "subsidy_percentage": subsidy_pct,
            "climate_risk_alert": climate_alert,
            "urgency_level": urgency,
            "claim_triggers": store.get("claim_triggers", []),
            "eligible_providers": store.get("insurance_providers", [])
        }

insurance_service = InsuranceService()
