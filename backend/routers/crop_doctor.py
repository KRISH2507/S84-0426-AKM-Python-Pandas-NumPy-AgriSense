from fastapi import APIRouter, Query, Body, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from services.crop_doctor_service import crop_doctor_service

router = APIRouter(prefix="/api/crop-doctor", tags=["Smart Crop Doctor"])

class DiagnoseRequest(BaseModel):
    crop: str
    affected_part: Optional[str] = "leaf"
    symptoms: List[str] = []

@router.post("/diagnose")
def diagnose_crop_disease(payload: DiagnoseRequest):
    """
    Diagnoses crop diseases from visual symptoms, affected plant part, and target crop.
    Returns ranked matches with confidence percentages, CIBRC chemical controls,
    and organic remedies.
    """
    if not payload.crop:
        raise HTTPException(status_code=400, detail="Target crop is required for diagnosis.")
        
    results = crop_doctor_service.diagnose(
        crop=payload.crop,
        affected_part=payload.affected_part,
        symptoms=payload.symptoms
    )
    return {
        "crop": payload.crop,
        "affected_part": payload.affected_part,
        "input_symptoms": payload.symptoms,
        "total_matches": len(results),
        "diagnoses": results
    }

@router.get("/diseases")
def list_diseases(crop: Optional[str] = Query(None, description="Optional crop filter")):
    """
    Returns the comprehensive agricultural disease catalog with preventive practices
    and CIBRC chemical dosages.
    """
    return crop_doctor_service.get_all_diseases(crop=crop)

@router.get("/dosage")
def calculate_dosage(
    disease_id: str = Query(..., description="ID of the diagnosed disease"),
    acres: float = Query(1.0, ge=0.1, le=100.0, description="Farm size in acres")
):
    """
    Calculates exact chemical dilution, spray water volume, and knapsack/battery
    sprayer tank counts for the farmer's acreage.
    """
    return crop_doctor_service.calculate_dosage(disease_id=disease_id, acres=acres)

@router.get("/symptoms-catalog")
def get_symptoms_catalog():
    """
    Returns a standardized dictionary of visual symptoms grouped by plant part
    for easy interactive chip selection in the UI.
    """
    return {
        "leaf": [
            {"id": "yellow_spots", "en": "Yellow spots / chlorosis", "hi": "पीले धब्बे", "mr": "पिवळे डाग", "ta": "மஞ்சள் புள்ளிகள்"},
            {"id": "brown_blight", "en": "Brown blighting / drying", "hi": "भूरा झुलसा", "mr": "तपकिरी करपा", "ta": "பழுப்பு கருகல்"},
            {"id": "rust_pustules", "en": "Orange / Yellow rust pustules", "hi": "रतुआ के दाने", "mr": "तांबेरा फोड", "ta": "துரு கொப்புளங்கள்"},
            {"id": "white_powder", "en": "White powdery patches", "hi": "सफेद पाउडर जैसी फफूंद", "mr": "पांढरी बुरशी", "ta": "வெள்ளை சாம்பல்"},
            {"id": "leaf_curl", "en": "Upward / downward leaf curling", "hi": "पत्ते मुड़ना (मरोड़िया)", "mr": "पाने आकसणे (चुरडा-मुरडा)", "ta": "இலை சுருட்டு"},
            {"id": "concentric_rings", "en": "Concentric rings (Target board)", "hi": "गोल छल्लेदार धब्बे", "mr": "गोलाकार वलय डाग", "ta": "வளைய புள்ளிகள்"},
            {"id": "water_soaked_spots", "en": "Water-soaked oily lesions", "hi": "पानीदार तेलिया धब्बे", "mr": "पाणथळ तेलकट डाग", "ta": "எண்ணெய் போன்ற புள்ளிகள்"}
        ],
        "fruit": [
            {"id": "holes", "en": "Boring holes & caterpillar droppings", "hi": "फलों में छेद व इल्ली", "mr": "फळांमधील छिद्रे व अळी", "ta": "காயில் துளைகள்"},
            {"id": "black_rot", "en": "Black rot / fruit decay", "hi": "काला सड़ांध", "mr": "काळी सड", "ta": "கருப்பு அழுகல்"},
            {"id": "stained_lint", "en": "Stained or discolored lint/grain", "hi": "दागी दाने या रुई", "mr": "डागाळलेले दाणे / कापूस", "ta": "நிறம் மாறிய தானியம்"}
        ],
        "stem": [
            {"id": "neck_rot", "en": "Stem / neck rot", "hi": "तना / गर्दन गलन", "mr": "खोड / मान कुजणे", "ta": "தண்டு அழுகல்"},
            {"id": "cankers", "en": "Dark stem lesions / cankers", "hi": "तने पर काले घाव", "mr": "खोडावरील काळे व्रण", "ta": "தண்டு புண்கள்"}
        ],
        "root": [
            {"id": "wilting", "en": "Sudden daytime wilting", "hi": "दिन में मुरझाना (उकठा)", "mr": "अचानक झाड सुकणे (मर रोग)", "ta": "திடீர் வாடல்"},
            {"id": "root_rot", "en": "Brown soggy roots / decay", "hi": "जड़ गलन", "mr": "मूळ कुज", "ta": "வேர் அழுகல்"}
        ]
    }
