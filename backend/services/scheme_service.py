import json
import os
from datetime import datetime, date
from pathlib import Path
from typing import List, Dict, Any, Optional

class SchemeService:
    """
    Handles Government Agricultural Subsidies Data, Dynamic Farmer Eligibility,
    and Living Store Management.
    """
    def __init__(self):
        self.store_path = Path(__file__).resolve().parent.parent / "data" / "subsidies_store.json"
        self._cache = None
        self._last_loaded = None

    def _load_store(self) -> Dict[str, Any]:
        """Loads and caches the subsidies JSON store from disk."""
        if not self.store_path.exists():
            return {
                "active_schemes": [],
                "historical_schemes": [],
                "metadata": {"total_active": 0, "total_historical": 0}
            }
        
        with open(self.store_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self._cache = data
        return data

    def _save_store(self, data: Dict[str, Any]):
        """Persists updated subsidies store to disk."""
        with open(self.store_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        self._cache = data

    @staticmethod
    def get_farmer_category(acres: float) -> str:
        """Categorizes farmers according to Government of India landholding standards."""
        if acres < 2.5:
            return "Marginal (<2.5 acres)"
        elif acres <= 5.0:
            return "Small (2.5-5 acres)"
        else:
            return "Medium / Large (>5 acres)"

    def get_recommended_schemes(self, state: str, crop: str, acres: float, season: Optional[str] = None) -> Dict[str, Any]:
        """
        Deterministic, rule-based matching engine for farmer eligibility.
        Filters active schemes by state, crop, and landholding category.
        """
        data = self._load_store()
        active_schemes = data.get("active_schemes", [])
        
        farmer_category = self.get_farmer_category(acres)
        state_clean = state.strip().lower() if state else ""
        crop_clean = crop.strip().lower() if crop else ""
        today_str = date.today().isoformat()

        eligible: List[Dict[str, Any]] = []
        upcoming_deadlines: List[Dict[str, Any]] = []

        for scheme in active_schemes:
            # 1. State check (match 'ALL' or specific state)
            scheme_states = [s.lower() for s in scheme.get("applicable_states", [])]
            if "all" not in scheme_states and state_clean not in scheme_states:
                continue

            # 2. Crop check (match 'ALL' or specific crop)
            scheme_crops = [c.lower() for c in scheme.get("applicable_crops", [])]
            if "all" not in scheme_crops and crop_clean not in scheme_crops:
                continue

            # 3. Acreage limits
            min_acres = scheme.get("min_acres")
            max_acres = scheme.get("max_acres")
            if min_acres is not None and acres < min_acres:
                continue
            if max_acres is not None and acres > max_acres:
                continue

            # 4. Farmer category check
            allowed_categories = scheme.get("farmer_categories", [])
            # If specified, farmer category must match at least one allowed
            if allowed_categories:
                # Check for substring match (e.g. 'Marginal' in 'Marginal (<2.5 acres)')
                cat_match = any(
                    farmer_category.split()[0].lower() in ac.lower()
                    for ac in allowed_categories
                )
                if not cat_match:
                    continue

            # 5. Check deadline (filter out past deadlines)
            deadline = scheme.get("deadline")
            days_left = None
            if deadline:
                try:
                    dl_date = datetime.strptime(deadline, "%Y-%m-%d").date()
                    if dl_date < date.today():
                        continue  # Expired
                    days_left = (dl_date - date.today()).days
                except Exception:
                    pass

            # Eligible!
            item = dict(scheme)
            if days_left is not None:
                item["days_left"] = days_left
                if days_left <= 45:
                    upcoming_deadlines.append({
                        "id": scheme["id"],
                        "title": scheme["title"],
                        "deadline": deadline,
                        "days_left": days_left,
                        "benefit_summary": scheme["benefit_summary"]
                    })
            else:
                item["days_left"] = 999

            eligible.append(item)

        # Sort eligible schemes: Approaching deadlines first, then highest annual benefit
        eligible.sort(
            key=lambda x: (x.get("days_left", 999), -x.get("estimated_annual_benefit_inr", 0))
        )

        total_benefit = sum(s.get("estimated_annual_benefit_inr", 0) for s in eligible)

        # Dynamic Notification Badge
        notification_badge = None
        if upcoming_deadlines:
            soonest = sorted(upcoming_deadlines, key=lambda x: x["days_left"])[0]
            notification_badge = f"Action Required: {soonest['title']} deadline in {soonest['days_left']} days!"

        return {
            "farmer_category": farmer_category,
            "state": state,
            "crop": crop,
            "acres": acres,
            "total_eligible_schemes": len(eligible),
            "total_estimated_benefit_inr": total_benefit,
            "schemes": eligible,
            "upcoming_deadlines": upcoming_deadlines,
            "notification_badge": notification_badge
        }

    def get_all_schemes(self) -> Dict[str, Any]:
        """Returns all active and archived historical subsidies."""
        data = self._load_store()
        return {
            "total_active": len(data.get("active_schemes", [])),
            "total_historical": len(data.get("historical_schemes", [])),
            "last_sync": data.get("metadata", {}).get("last_sync_timestamp", datetime.utcnow().isoformat()),
            "active_schemes": data.get("active_schemes", []),
            "historical_schemes": data.get("historical_schemes", [])
        }

    def add_or_update_scheme(self, scheme_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Inserts a new scheme or updates an existing one in the active store."""
        data = self._load_store()
        active = data.get("active_schemes", [])
        scheme_id = scheme_dict.get("id")

        if not scheme_id:
            import uuid
            scheme_id = f"scheme_{uuid.uuid4().hex[:8]}"
            scheme_dict["id"] = scheme_id

        # Check if already exists
        existing_idx = None
        for i, s in enumerate(active):
            if s.get("id") == scheme_id or s.get("title", "").strip().lower() == scheme_dict.get("title", "").strip().lower():
                existing_idx = i
                break

        action = "updated" if existing_idx is not None else "created"
        if existing_idx is not None:
            active[existing_idx] = scheme_dict
        else:
            active.insert(0, scheme_dict)

        data["active_schemes"] = active
        data["metadata"]["total_active"] = len(active)
        data["metadata"]["last_sync_timestamp"] = datetime.utcnow().isoformat() + "Z"

        self._save_store(data)
        return {
            "success": True,
            "action": action,
            "scheme": scheme_dict,
            "message": f"Scheme '{scheme_dict.get('title')}' successfully {action} in AgriSense living store."
        }

scheme_service = SchemeService()
