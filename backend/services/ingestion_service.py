import json
import os
import re
from datetime import datetime, date
from typing import Dict, Any, Optional
from groq import AsyncGroq
from services.scheme_service import scheme_service

class IngestionService:
    """
    Living Document Ingestion Engine for AgriSense.
    Extracts structured government subsidy policies from raw text, circulars,
    or press releases using Groq LLM with strict validation.
    """
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self.client = AsyncGroq(api_key=self.api_key) if self.api_key else None

    async def ingest_announcement(
        self,
        text_announcement: Optional[str] = None,
        scheme_json: Optional[Dict[str, Any]] = None,
        source_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Parses raw announcement text or validates incoming JSON,
        then inserts/updates the living database.
        """
        if scheme_json:
            extracted = self._normalize_scheme_dict(scheme_json, source_url)
            return scheme_service.add_or_update_scheme(extracted)

        if not text_announcement or len(text_announcement.strip()) < 10:
            return {
                "success": False,
                "action": "failed",
                "scheme": None,
                "message": "Announcement text is too short or empty."
            }

        extracted_data = await self._extract_with_llm(text_announcement, source_url)
        return scheme_service.add_or_update_scheme(extracted_data)

    async def _extract_with_llm(self, text: str, source_url: Optional[str]) -> Dict[str, Any]:
        """Uses Groq Llama3 to parse messy circulars into structured Pydantic-compatible JSON."""
        if self.client:
            prompt = f"""
You are an expert Indian Agricultural Policy Ingestion Parser for AgriSense.
Your task is to extract structured subsidy metadata from this government announcement or news release:

\"\"\"{text}\"\"\"

Return ONLY valid JSON matching this exact format (no markdown, no other words):
{{
  "title": "Clean Scheme Name",
  "category": "e.g. Irrigation Equipment, Direct Cash Support, Farm Machinery, Solar Energy, Crop Diversification",
  "provider": "e.g. Government of Haryana / Central Government",
  "applicable_states": ["ALL"] or list of state names e.g. ["Punjab", "Haryana"],
  "applicable_crops": ["ALL"] or list of crops e.g. ["Wheat", "Rice", "Mustard"],
  "farmer_categories": ["Marginal (<2.5 acres)", "Small (2.5-5 acres)", "Medium / Large (>5 acres)"],
  "min_acres": null or float,
  "max_acres": null or float,
  "benefit_type": "Brief type of benefit",
  "benefit_summary": "Concise summary of financial assistance and rate",
  "estimated_annual_benefit_inr": number (estimate total financial benefit in INR, e.g. 15000),
  "subsidy_rate": "e.g. 50% or ₹7,000 per acre",
  "deadline": "YYYY-MM-DD" or null,
  "urgency": "High", "Expiring Soon", or "Active Enrollment",
  "required_documents": ["List", "Of", "Key", "Documents"],
  "official_url": "{source_url or 'https://agricoop.nic.in'}",
  "description": "Short 2-line summary of objectives"
}}
"""
            try:
                chat_completion = await self.client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a strict JSON extraction assistant. Output only JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    model="llama-3.3-70b-versatile",
                    temperature=0.1,
                    max_tokens=1000
                )
                raw_response = chat_completion.choices[0].message.content.strip()
                # Clean up any potential markdown fences
                cleaned = re.sub(r"^```json\s*", "", raw_response)
                cleaned = re.sub(r"^```\s*", "", cleaned)
                cleaned = re.sub(r"\s*```$", "", cleaned)
                parsed = json.loads(cleaned)
                return self._normalize_scheme_dict(parsed, source_url)
            except Exception as e:
                print(f"[WARN] LLM extraction error: {e}. Falling back to heuristic extractor.")

        # Heuristic fallback if LLM or API is unavailable
        return self._heuristic_extractor(text, source_url)

    def _heuristic_extractor(self, text: str, source_url: Optional[str]) -> Dict[str, Any]:
        """Rule-based extraction fallback for resilience."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        title = lines[0] if lines else "New Government Agricultural Subsidy"
        
        # State detection
        states_found = []
        known_states = ["punjab", "haryana", "uttar pradesh", "maharashtra", "rajasthan", "madhya pradesh", "bihar", "gujarat"]
        for st in known_states:
            if st in text.lower():
                states_found.append(st.title())

        # Crop detection
        crops_found = []
        known_crops = ["wheat", "rice", "cotton", "mustard", "maize", "soybean", "sugarcane", "tomato", "potato", "onion"]
        for cr in known_crops:
            if cr in text.lower():
                crops_found.append(cr.title())

        # Monetary amount detection
        money_match = re.search(r"₹\s*([0-9,]+)|rs\.?\s*([0-9,]+)", text, re.IGNORECASE)
        benefit_amt = 10000.0
        if money_match:
            val_str = (money_match.group(1) or money_match.group(2)).replace(",", "")
            try:
                benefit_amt = float(val_str)
            except Exception:
                pass

        return {
            "title": title[:80],
            "category": "Government Farm Assistance",
            "provider": states_found[0] + " Government" if states_found else "Government of India",
            "applicable_states": states_found if states_found else ["ALL"],
            "applicable_crops": crops_found if crops_found else ["ALL"],
            "farmer_categories": ["Marginal (<2.5 acres)", "Small (2.5-5 acres)", "Medium / Large (>5 acres)"],
            "min_acres": None,
            "max_acres": None,
            "benefit_type": "Direct Subsidy Support",
            "benefit_summary": f"Financial benefit estimated up to ₹{benefit_amt:,.0f}.",
            "estimated_annual_benefit_inr": benefit_amt,
            "subsidy_rate": "Government Notified Rate",
            "deadline": "2026-11-30",
            "urgency": "Active Enrollment",
            "required_documents": [
                "Aadhaar Card",
                "Land Ownership Record (Khasra / 7/12)",
                "Bank Account Passbook"
            ],
            "official_url": source_url or "https://agricoop.nic.in",
            "description": text[:200] + "..." if len(text) > 200 else text
        }

    def _normalize_scheme_dict(self, s: Dict[str, Any], source_url: Optional[str]) -> Dict[str, Any]:
        """Ensures all required keys and correct data types exist."""
        import uuid
        scheme_id = s.get("id") or f"ingested_{uuid.uuid4().hex[:8]}"
        
        return {
            "id": scheme_id,
            "title": str(s.get("title", "Government Farm Scheme")),
            "category": str(s.get("category", "Agricultural Subsidy")),
            "provider": str(s.get("provider", "Government")),
            "applicable_states": s.get("applicable_states") or ["ALL"],
            "applicable_crops": s.get("applicable_crops") or ["ALL"],
            "farmer_categories": s.get("farmer_categories") or ["Marginal (<2.5 acres)", "Small (2.5-5 acres)", "Medium / Large (>5 acres)"],
            "min_acres": float(s["min_acres"]) if s.get("min_acres") is not None else None,
            "max_acres": float(s["max_acres"]) if s.get("max_acres") is not None else None,
            "benefit_type": str(s.get("benefit_type", "Subsidy Benefit")),
            "benefit_summary": str(s.get("benefit_summary", "Government financial assistance")),
            "estimated_annual_benefit_inr": float(s.get("estimated_annual_benefit_inr", 5000)),
            "subsidy_rate": str(s.get("subsidy_rate", "Government Rate")),
            "deadline": s.get("deadline") or (date.today().replace(year=date.today().year + 1).isoformat()),
            "urgency": str(s.get("urgency", "Active Enrollment")),
            "required_documents": s.get("required_documents") or ["Aadhaar Card", "Land Record", "Bank Passbook"],
            "official_url": str(s.get("official_url") or source_url or "https://agricoop.nic.in"),
            "description": str(s.get("description", "Government agricultural assistance program."))
        }

ingestion_service = IngestionService()
