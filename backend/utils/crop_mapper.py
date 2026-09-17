"""
Crop name normalization and aliasing.
Handles case-insensitivity, spacing, and synonyms.
"""

CROP_ALIASES = {
    "wheat": ["wheat"],
    "rice": ["rice"],
    "potato": ["potato", "potatoes", "aaloo"],
    "tomato": ["tomato", "tomatoes"],
    "maize": ["maize", "corn", "makka"],
}

def normalize_crop_name(crop: str) -> str:
    """
    Normalize crop name: lowercase, strip whitespace.
    Returns the canonical form or the input if no match found.
    """
    if not crop:
        return crop
    normalized = crop.lower().strip()
    return normalized

def find_canonical_crop(crop: str) -> str:
    """
    Find the canonical crop name from aliases.
    Returns the first (canonical) form if found, or capitalized crop if not in aliases.
    """
    if not crop:
        return ""
    normalized = normalize_crop_name(crop)
    for canonical, aliases in CROP_ALIASES.items():
        if normalized in aliases:
            return canonical.capitalize()  # Return capitalized form (Wheat, Rice, etc.)
    return crop.strip().capitalize()  # fallback to capitalize the input string

def get_all_canonical_crops() -> List[str]:
    \"\"\"Get list of all supported canonical crop names.
    
    Returns:
        List of canonical crop names in title case
    \"\"\"\n    return [key.capitalize() for key in CROP_ALIASES.keys()]

def log_crop_search(requested: str, canonical: str, found: bool, count: int = 0):
    """Log crop search results for debugging."""
    status = "FOUND" if found else "NOT_FOUND"
    count_msg = f"({count} records)" if found else ""
    print(f"[CROP_SEARCH] Requested: '{requested}' -> Canonical: '{canonical}' -> {status} {count_msg}")
