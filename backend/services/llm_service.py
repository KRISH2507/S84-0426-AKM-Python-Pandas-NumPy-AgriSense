from dotenv import load_dotenv
import os
import asyncio
from fastapi import HTTPException
from groq import AsyncGroq
from services.data_service import DataService
from services.yield_service import yield_service
from services.climate_service import climate_service

load_dotenv()
load_dotenv(".env.local")

# FIXED: Default user mock profile for context injection
MOCK_USER_PROFILE = {
    "name": "Rajan",
    "crop": "Wheat",
    "season": "Rabi",
    "location": "Punjab",
    "acres": 12,
    "soil_type": "Alluvial",
    "rainfall": 120.0,
    "fertilizer": 80.0
}

data_service = DataService()

class LLMService:
    """
    Connects to the Groq API (using Llama3) to generate natural language advice at lightning speed.
    """
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = AsyncGroq(api_key=self.api_key) if self.api_key else None

    async def generate_insight(self, context_data: dict) -> str:
        """
        Asynchronously calls the Groq LLM with the provided context.
        """
        prompt = f"""
You are an experienced agricultural advisor in Himachal Pradesh, India. 
Speak in simple, friendly, Hindi-friendly English. 
Given this farmer data: 
- Crop: {context_data.get('crop')}
- Predicted Yield: {context_data.get('predicted_yield')} quintals/acre
- Current Market Price: ₹{context_data.get('current_price')}
- Climate Risk: {context_data.get('climate_risk_level')}

Write a helpful 2-paragraph insight and practical advice for the farmer.
"""
        
        if not self.client:
            return self._synthesize_insight_fallback(context_data)
            
        try:
            # Live Groq API Call
            response = await self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are an expert, friendly agricultural advisor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=250
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[INFO] External LLM unavailable ({e}). Using AgriSense Resilient Advisory Engine.")
            return self._synthesize_insight_fallback(context_data)

    def _synthesize_insight_fallback(self, ctx: dict) -> str:
        crop = ctx.get("crop", "Wheat")
        yield_val = ctx.get("predicted_yield", 24.5)
        price = ctx.get("current_price", 2200)
        risk = ctx.get("climate_risk_level", "Low")
        
        advice_text = (
            f"Namaste! For your {crop} crop, current harvest projections estimate an output of ~{yield_val} quintals per acre. "
            f"With prevailing wholesale mandi rates hovering around ₹{price:,.0f} per quintal, your revenue potential is healthy.\n\n"
            f"Climate Advisory: Risk index is currently {risk}. Maintain split-application irrigation and check your Soil Health Card "
            f"micronutrient ratios. For crop protection, enroll under PMFBY to cap your insurance risk at only 1.5%-2%."
        )
        return advice_text

    async def chat(self, history: list, message: str, user_profile: dict = None) -> str:
        """
        Asynchronously handles conversational chat via the LLM API with resilient domain fallback.
        """
        profile = user_profile if user_profile else MOCK_USER_PROFILE
        crop = profile.get("crop", "Wheat")
        
        try:
            market_data = data_service.get_market_data(crop)
            current_price = market_data.get("current_price", 0)
            price_change_7d = market_data.get("price_change_7d_percent", 0)
        except Exception:
            current_price = 2275.0
            price_change_7d = 0.5
            
        try:
            yield_data = yield_service.predict_yield(
                crop=crop, 
                rainfall=profile.get("rainfall", 100.0), 
                fertilizer=profile.get("fertilizer", 50.0), 
                season=profile.get("season", "Rabi"), 
                soil_type=profile.get("soil_type", "Alluvial"), 
                acres=profile.get("acres", 5)
            )
            predicted_yield = yield_data.get("predicted_yield", 25.0)
        except Exception:
            predicted_yield = 25.0
            
        try:
            climate_data = climate_service.get_climate_risk(crop=crop)
            climate_risk = climate_data.get("risk_level", "Low")
        except Exception:
            climate_risk = "Low"

        system_prompt = f"""You are a helpful, expert AI agricultural advisor. Provide concise, friendly answers in simple, Hindi-friendly English.
You are talking to {profile.get("name", "Farmer")}.
Current farm profile:
- Primary Crop: {crop}
- Season: {profile.get("season", "Rabi")}
- Current Market Price: ₹{current_price} ({price_change_7d}% in last 7 days)
- Yield Prediction: {predicted_yield} quintals/acre
- Climate Risk Level: {climate_risk}
Always use this context to answer questions meaningfully."""

        messages = [{"role": "system", "content": system_prompt}]
        for msg in history[-5:]:
            if hasattr(msg, "role") and hasattr(msg, "content"):
                messages.append({"role": msg.role, "content": msg.content})
            elif isinstance(msg, dict):
                messages.append({"role": msg.get("role"), "content": msg.get("content")})
        
        if not history or (messages and messages[-1].get("content") != message):
            messages.append({"role": "user", "content": message})

        if self.client:
            try:
                response = await self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=300
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"[INFO] LLM API call fallback engaged: {e}")

        # Intelligent Zero-Crash Domain Advisory Fallback
        return self._domain_advisory_reply(message, profile, current_price, price_change_7d, predicted_yield, climate_risk)

    def _domain_advisory_reply(self, message: str, profile: dict, price: float, change: float, yield_val: float, risk: str) -> str:
        q = message.lower()
        name = profile.get("name", "Kisan")
        crop = profile.get("crop", "Wheat")
        acres = profile.get("acres", 3.0)
        state = profile.get("location", "Punjab")

        if any(w in q for w in ["sell", "market", "rate", "price", "mandi", "bhav"]):
            trend_word = "strengthening" if change >= 0 else "softening slightly"
            return (
                f"Namaste {name}! In your region ({state}), the wholesale mandi rate for {crop} is currently around ₹{price:,.0f} per quintal "
                f"({trend_word} by {abs(change):.1f}% over the last 7 days). "
                f"With an estimated yield of {yield_val} quintals/acre across your {acres} acres, you can expect ~{(yield_val * float(acres)):.0f} quintals total. "
                f"Recommendation: Stagger your sales in two tranches to hedge against mid-season price volatility."
            )
        elif any(w in q for w in ["subsidy", "subsidies", "yojana", "scheme", "grant", "sarkar"]):
            return (
                f"Namaste {name}! Based on your {acres}-acre {crop} farm in {state}: "
                f"1. PMKSY Per Drop More Crop offers 55% subsidy on Drip/Sprinkler systems for Small & Marginal farmers.\n"
                f"2. SMAM provides 40%-50% subsidy for rotavators and laser land levelers.\n"
                f"3. PM-KUSUM provides up to 60% subsidy on Solar Agriculture Pumps.\n"
                f"Check the 'Subsidies & Insurance' tab in AgriSense to view your document checklist and apply directly!"
            )
        elif any(w in q for w in ["insurance", "bima", "pmfby", "protect", "loss", "risk"]):
            rate = 1.5 if crop.lower() in ["wheat", "mustard", "gram"] else 2.0
            return (
                f"Namaste {name}! Under the Pradhan Mantri Fasal Bima Yojana (PMFBY), your premium for {crop} is legally capped at only {rate}% of the Sum Insured. "
                f"The central and state governments pay the remaining 80%+ of the actuarial cost. "
                f"With current climate risk at {risk}, securing your coverage before the cutoff date protects against prevented sowing, localized hailstorms, and post-harvest unseasonal rain."
            )
        elif any(w in q for w in ["fertilizer", "urea", "dap", "khad", "spray", "pest"]):
            return (
                f"Namaste {name}! For {crop} on {profile.get('soil_type', 'Alluvial')} soil: "
                f"Apply balanced N-P-K in a 4:2:1 ratio. Apply full DAP and Potash as basal dressing during sowing, "
                f"and split Urea into two top-dressings: 1st at crown root initiation (20-25 days) and 2nd at jointing stage. "
                f"Ensure you conduct a free soil test under the Soil Health Card scheme to avoid nitrogen wastage!"
            )
        else:
            return (
                f"Namaste {name}! As your AgriSense Advisor for {crop} in {state}: "
                f"Your farm is tracking {yield_val} quintals/acre yield potential under {risk} weather risk. "
                f"Mandi prices are trading around ₹{price:,.0f}/quintal. "
                f"Feel free to ask me about fertilizer dosages, mandi selling timing, pest remedies, or government subsidies!"
            )

llm_service = LLMService()
