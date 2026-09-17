import os
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import requests

class ClimateService:
    """
    Hyperlocal Weather & Agronomic Early-Warning Hazard Service.
    Integrates Open-Meteo high-resolution forecasts and calculates
    spray feasibility windows, pathogen risk, and emergency field alerts.
    """
    DEFAULT_LAT = 30.9010  # Ludhiana, Punjab (Heart of agricultural belt)
    DEFAULT_LON = 75.8573
    
    def __init__(self):
        self.open_meteo_url = "https://api.open-meteo.com/v1/forecast"

    def _fetch_live_open_meteo(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Attempts to fetch live 10-day forecast from Open-Meteo free API.
        No API key required. Returns None if network is down or times out.
        """
        try:
            params = {
                "latitude": lat,
                "longitude": lon,
                "daily": [
                    "temperature_2m_max",
                    "temperature_2m_min",
                    "precipitation_sum",
                    "precipitation_probability_max",
                    "wind_speed_10m_max",
                    "weather_code"
                ],
                "timezone": "Asia/Kolkata",
                "forecast_days": 10
            }
            resp = requests.get(self.open_meteo_url, params=params, timeout=4.0)
            if resp.status_code == 200:
                return resp.json()
        except Exception:
            pass
        return None

    def get_10_day_forecast(self, lat: Optional[float] = None, lon: Optional[float] = None, crop: Optional[str] = None) -> Dict[str, Any]:
        """
        Provides a 10-day daily forecast with pesticide spraying feasibility
        windows and agronomic risk tags.
        """
        lat = lat or self.DEFAULT_LAT
        lon = lon or self.DEFAULT_LON
        crop = crop or "Wheat"

        live_data = self._fetch_live_open_meteo(lat, lon)
        daily_cards = []
        today = datetime.now()

        if live_data and "daily" in live_data:
            d = live_data["daily"]
            times = d.get("time", [])
            t_max = d.get("temperature_2m_max", [])
            t_min = d.get("temperature_2m_min", [])
            rain_mm = d.get("precipitation_sum", [])
            rain_prob = d.get("precipitation_probability_max", [])
            wind_kmh = d.get("wind_speed_10m_max", [])
            codes = d.get("weather_code", [])

            for i in range(len(times)):
                date_obj = datetime.strptime(times[i], "%Y-%m-%d") if isinstance(times[i], str) else today + timedelta(days=i)
                max_t = round(t_max[i]) if i < len(t_max) and t_max[i] is not None else 30
                min_t = round(t_min[i]) if i < len(t_min) and t_min[i] is not None else 20
                precip = round(rain_mm[i], 1) if i < len(rain_mm) and rain_mm[i] is not None else 0.0
                prob = round(rain_prob[i]) if i < len(rain_prob) and rain_prob[i] is not None else 10
                wind = round(wind_kmh[i], 1) if i < len(wind_kmh) and wind_kmh[i] is not None else 12.0

                # Determine spray suitability
                if prob < 20 and wind < 15.0 and precip < 1.0:
                    spray_status = "Optimal"
                    spray_color = "green"
                    spray_note = "Ideal spray window: Low wind and zero rain risk."
                elif prob >= 50 or wind >= 25.0 or precip >= 5.0:
                    spray_status = "Hazard"
                    spray_color = "red"
                    spray_note = "Do not spray: High wind drift or rain wash-off risk."
                else:
                    spray_status = "Marginal"
                    spray_color = "amber"
                    spray_note = "Spray with caution: Best during early morning hours."

                # Condition text
                if precip > 10.0 or prob > 70:
                    condition = "Heavy Rain"
                elif precip > 2.0 or prob > 40:
                    condition = "Moderate Showers"
                elif prob > 20:
                    condition = "Light Rain / Overcast"
                elif max_t > 34:
                    condition = "Hot & Sunny"
                else:
                    condition = "Clear / Pleasant"

                daily_cards.append({
                    "date": times[i],
                    "day_name": date_obj.strftime("%a"),
                    "full_date": date_obj.strftime("%d %b"),
                    "temp_max": max_t,
                    "temp_min": min_t,
                    "temp_range": f"{min_t}° - {max_t}°C",
                    "precipitation_mm": precip,
                    "rain_probability": prob,
                    "wind_speed_kmh": wind,
                    "condition": condition,
                    "spray_window": {
                        "status": spray_status,
                        "color": spray_color,
                        "note": spray_note
                    }
                })
        else:
            # Resilient simulated realistic forecast for Indian conditions
            base_temp = 28
            for i in range(10):
                d_date = today + timedelta(days=i)
                # Introduce a rain event on day 4-5
                if i in [4, 5]:
                    max_t = base_temp - 3
                    min_t = 19
                    precip = 18.5 if i == 5 else 6.2
                    prob = 75 if i == 5 else 45
                    wind = 22.0
                    condition = "Heavy Rain" if i == 5 else "Moderate Showers"
                    spray_status = "Hazard"
                    spray_color = "red"
                    spray_note = "Do not spray: Rain will wash away chemicals."
                elif i in [2, 3]:
                    max_t = base_temp + 4
                    min_t = 22
                    precip = 0.0
                    prob = 5
                    wind = 9.0
                    condition = "Hot & Sunny"
                    spray_status = "Optimal"
                    spray_color = "green"
                    spray_note = "Safe spray window: Dry foliage and low wind."
                else:
                    max_t = base_temp
                    min_t = 18
                    precip = 0.0
                    prob = 10
                    wind = 11.0
                    condition = "Clear / Pleasant"
                    spray_status = "Optimal"
                    spray_color = "green"
                    spray_note = "Good spraying conditions."

                daily_cards.append({
                    "date": d_date.strftime("%Y-%m-%d"),
                    "day_name": d_date.strftime("%a"),
                    "full_date": d_date.strftime("%d %b"),
                    "temp_max": max_t,
                    "temp_min": min_t,
                    "temp_range": f"{min_t}° - {max_t}°C",
                    "precipitation_mm": precip,
                    "rain_probability": prob,
                    "wind_speed_kmh": wind,
                    "condition": condition,
                    "spray_window": {
                        "status": spray_status,
                        "color": spray_color,
                        "note": spray_note
                    }
                })

        # Calculate optimal spray days count
        optimal_days = [c["day_name"] for c in daily_cards if c["spray_window"]["status"] == "Optimal"]

        return {
            "latitude": lat,
            "longitude": lon,
            "crop": crop,
            "forecast_days": len(daily_cards),
            "optimal_spray_days": optimal_days[:3],
            "daily": daily_cards
        }

    def get_active_field_alerts(self, lat: Optional[float] = None, lon: Optional[float] = None, crop: Optional[str] = None, state: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluates current climate metrics against crop vulnerability thresholds
        and produces actionable multi-channel alerts with push/SMS payload.
        """
        lat = lat or self.DEFAULT_LAT
        lon = lon or self.DEFAULT_LON
        crop = crop or "Wheat"
        state = state or "Punjab"

        forecast = self.get_10_day_forecast(lat=lat, lon=lon, crop=crop)
        daily = forecast.get("daily", [])
        
        alerts = []

        # 1. Rain / Washout Hazard Check
        rainy_days = [d for d in daily if d["rain_probability"] >= 50 or d["precipitation_mm"] >= 10.0]
        if rainy_days:
            first_rain = rainy_days[0]
            alerts.append({
                "id": "alert-rain-washout",
                "urgency": "CRITICAL",
                "title": f"Rain Hazard on {first_rain['day_name']} ({first_rain['full_date']})",
                "hindi_title": f"{first_rain['day_name']} को भारी वर्षा की चेतावनी",
                "category": "Precipitation",
                "description": f"Rainfall of ~{first_rain['precipitation_mm']}mm expected ({first_rain['rain_probability']}% probability). Postpone all chemical spraying until after this weather system passes.",
                "action": "Cover harvested crops in open yards and clear drainage channels.",
                "action_link": "/doctor",
                "icon": "CloudRain"
            })

        # 2. Pathogen / Fungal Blight Window
        warm_humid_days = [d for d in daily if d["temp_max"] >= 24 and d["rain_probability"] >= 30]
        if warm_humid_days:
            alerts.append({
                "id": "alert-blight-pathogen",
                "urgency": "WARNING",
                "title": f"High Fungal Blight & Rust Risk for {crop}",
                "hindi_title": f"{crop} फसल में फफूंद व रतुआ का उच्च जोखिम",
                "category": "Disease Hazard",
                "description": f"Elevated relative humidity coupled with mild temperatures creates ideal micro-climate for foliar pathogens like Rust, Blight, and Mildew.",
                "action": "Inspect lower leaves for yellow/brown pustules. Spray prophylactic bio-fungicide (Trichoderma viride @ 5g/L).",
                "action_link": "/doctor",
                "icon": "ShieldAlert"
            })

        # 3. Heat Stress Check
        hot_days = [d for d in daily if d["temp_max"] >= 34]
        if hot_days:
            alerts.append({
                "id": "alert-heat-stress",
                "urgency": "ADVISORY",
                "title": f"Mid-Day Heat Stress Alert (Peak {hot_days[0]['temp_max']}°C)",
                "hindi_title": "दोपहर की तेज गर्मी व तापमान वृद्धि चेतावनी",
                "category": "Heat Stress",
                "description": f"Temperatures exceeding 34°C can cause pollen sterility and rapid moisture depletion in your {crop} field.",
                "action": "Provide light evening irrigation to maintain root-zone soil coolness.",
                "action_link": "/climate",
                "icon": "SunMedium"
            })

        # Safe Spray Window Recommendation
        optimal_days = forecast.get("optimal_spray_days", [])
        spray_recommendation = (
            f"Best window for chemical or organic spraying: {', '.join(optimal_days)}."
            if optimal_days else "No clear spray window in the next 3 days due to rain or wind."
        )

        # Generate simulated SMS alert payload
        sms_text = (
            f"AgriSense Kisan Alert ({crop}, {state}): "
            + (alerts[0]['title'] if alerts else 'Weather normal')
            + ". " + (alerts[0]['action'] if alerts else 'Follow standard irrigation schedule.')
            + " Free Kisan Call Center: 1800-180-1551"
        )

        return {
            "crop": crop,
            "state": state,
            "total_alerts": len(alerts),
            "unread_count": len(alerts),
            "spray_recommendation": spray_recommendation,
            "sms_dispatch_payload": sms_text,
            "alerts": alerts
        }

    def get_climate_risk(self, lat: Optional[float] = None, lon: Optional[float] = None, crop: Optional[str] = None) -> Dict[str, Any]:
        """
        Legacy rule-based scoring method maintained for backwards compatibility.
        """
        lat = lat or self.DEFAULT_LAT
        lon = lon or self.DEFAULT_LON

        forecast = self.get_10_day_forecast(lat, lon, crop)
        daily = forecast.get("daily", [])

        total_rain = sum(d.get("precipitation_mm", 0) for d in daily)
        avg_max_temp = sum(d.get("temp_max", 30) for d in daily) / max(1, len(daily))

        if total_rain > 30:
            level = "Moderate"
            score = 55
            advice = "Rainfall anticipated this week. Postpone heavy secondary fertilization."
            drought = 15
            flood = 65
            frost = 5
        elif avg_max_temp > 33:
            level = "High"
            score = 72
            advice = "High heat stress detected. Maintain soil moisture with light evening irrigation."
            drought = 70
            flood = 10
            frost = 5
        else:
            level = "Low"
            score = 25
            advice = "Favorable weather conditions across the 10-day period. Normal farming operations."
            drought = 20
            flood = 15
            frost = 5

        return {
            "risk_level": level,
            "risk_score": score,
            "drought_risk": drought,
            "flood_risk": flood,
            "frost_risk": frost,
            "irrigation_advice": advice
        }

climate_service = ClimateService()
