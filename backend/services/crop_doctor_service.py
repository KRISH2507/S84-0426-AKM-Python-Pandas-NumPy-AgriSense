"""
Crop Doctor & Disease Diagnostic Service for AgriSense.
Provides knowledge-based disease identification, CIBRC-approved chemical and biological
prescriptions, and acreage-based dosage calculations for Indian farmers.
"""

from typing import List, Dict, Any, Optional
import math

class CropDoctorService:
    def __init__(self):
        self.diseases_db = self._load_disease_database()

    def _load_disease_database(self) -> List[Dict[str, Any]]:
        return [
            # --- WHEAT ---
            {
                "id": "wheat-yellow-rust",
                "crop": "Wheat",
                "common_name": "Yellow / Stripe Rust",
                "hindi_name": "पीला रतुआ (Yellow Rust)",
                "marathi_name": "पिवळा तांबेरा",
                "tamil_name": "மஞ்சள் துரு நோய்",
                "scientific_name": "Puccinia striiformis",
                "affected_part": "leaf",
                "symptoms": ["yellow_spots", "rust_pustules", "stripes", "powder_dust"],
                "description": "Linear yellow-orange pustules arranged in parallel stripes on leaves. Severely reduces photosynthetic area in northern wheat belts.",
                "favorable_weather": "Cool (10-20°C) with high humidity, dew, or morning mist.",
                "severity": "High",
                "chemical_control": {
                    "active_ingredient": "Propiconazole 25% EC",
                    "brand_examples": "Tilt, Bumper, Radar",
                    "dose_per_liter": "1.0 ml",
                    "dose_per_acre": "200 ml in 200 Liters water",
                    "application_instructions": "Spray at the earliest appearance of yellow pustules. Repeat after 15 days if stripe development persists.",
                    "phi_days": 30
                },
                "organic_control": {
                    "remedy": "Neem Oil 1500 PPM + Cow Urine Spray",
                    "preparation": "Mix 5 ml Neem Oil with 1 ml liquid soap and 100 ml aged cow urine per liter of water.",
                    "application": "Spray early morning on both sides of foliage."
                },
                "preventive_practices": [
                    "Sow rust-resistant varieties (HD 2967, HD 3086, DBW 187, DBW 222).",
                    "Avoid excessive nitrogen fertilization which increases leaf succulence."
                ]
            },
            {
                "id": "wheat-karnal-bunt",
                "crop": "Wheat",
                "common_name": "Karnal Bunt",
                "hindi_name": "करनाल बंट (Karnal Bunt)",
                "marathi_name": "कर्नाल बंट",
                "tamil_name": "கர்னால் பன்ட்",
                "scientific_name": "Tilletia indica",
                "affected_part": "fruit",
                "symptoms": ["black_rot", "fishy_odor", "grain_decay"],
                "description": "Partial conversion of wheat kernels into black powdery masses with a characteristic rotten fish odor (trimethylamine).",
                "favorable_weather": "Mild temperatures (18-24°C) with frequent cloudiness/light rains during heading.",
                "severity": "Moderate",
                "chemical_control": {
                    "active_ingredient": "Tebuconazole 25.9% EC",
                    "brand_examples": "Folicur, Orius",
                    "dose_per_liter": "1.0 ml",
                    "dose_per_acre": "200 ml in 200 Liters water",
                    "application_instructions": "Spray once at 50% earhead emergence (heading stage).",
                    "phi_days": 35
                },
                "organic_control": {
                    "remedy": "Trichoderma viride Seed Treatment",
                    "preparation": "Treat seeds with Trichoderma viride 1% WP @ 4g/kg seed before sowing.",
                    "application": "Apply Trichoderma enriched FYM in soil during land preparation."
                },
                "preventive_practices": [
                    "Use certified, disease-free seed stocks.",
                    "Avoid excessive irrigation during ear emergence."
                ]
            },
            {
                "id": "wheat-powdery-mildew",
                "crop": "Wheat",
                "common_name": "Powdery Mildew",
                "hindi_name": "चूर्णी फफूंद (Powdery Mildew)",
                "marathi_name": "भुरी रोग",
                "tamil_name": "சாம்பல் நோய்",
                "scientific_name": "Blumeria graminis f.sp. tritici",
                "affected_part": "leaf",
                "symptoms": ["white_powder", "yellow_spots", "leaf_drying"],
                "description": "White to grayish cottony/powdery fungal patches on upper leaf surfaces, sheaths, and glumes.",
                "favorable_weather": "Warm days (20-25°C) and cool humid nights.",
                "severity": "Moderate",
                "chemical_control": {
                    "active_ingredient": "Hexaconazole 5% SC",
                    "brand_examples": "Contaf, Sitara",
                    "dose_per_liter": "2.0 ml",
                    "dose_per_acre": "400 ml in 200 Liters water",
                    "application_instructions": "Spray as soon as initial white patches appear.",
                    "phi_days": 28
                },
                "organic_control": {
                    "remedy": "Sulfur Dusting or Sour Buttermilk Spray",
                    "preparation": "Mix 2 Liters fermented sour buttermilk (Chhachh) in 15 Liters water.",
                    "application": "Spray foliage thoroughly on calm sunny mornings."
                },
                "preventive_practices": [
                    "Avoid dense plant canopy; maintain 20-22 cm row spacing.",
                    "Avoid excessive irrigation."
                ]
            },

            # --- RICE ---
            {
                "id": "rice-blast",
                "crop": "Rice",
                "common_name": "Rice Blast (Leaf & Neck Blast)",
                "hindi_name": "धान का झुलसा रोग (Blast)",
                "marathi_name": "भात करपा रोग",
                "tamil_name": "நெல் குலை நோய்",
                "scientific_name": "Magnaporthe oryzae",
                "affected_part": "leaf",
                "symptoms": ["brown_blight", "spindle_spots", "leaf_drying", "neck_rot"],
                "description": "Spindle-shaped / diamond-shaped lesions with gray-white centers and brownish-red borders on leaves and black rot at neck of panicle.",
                "favorable_weather": "Night temp 19-24°C, relative humidity > 90%, frequent dew and drizzling.",
                "severity": "Critical",
                "chemical_control": {
                    "active_ingredient": "Tricyclazole 75% WP",
                    "brand_examples": "Beam, Sivic, Baan",
                    "dose_per_liter": "0.6 g",
                    "dose_per_acre": "120 g in 200 Liters water",
                    "application_instructions": "Apply first spray at tillering initiation and second spray at panicle emergence.",
                    "phi_days": 30
                },
                "organic_control": {
                    "remedy": "Pseudomonas fluorescens Spray",
                    "preparation": "Dissolve Pseudomonas fluorescens 0.5% WP @ 2.5 g/L in water.",
                    "application": "Foliar spray at 30, 45, and 60 days after transplanting."
                },
                "preventive_practices": [
                    "Split Nitrogen doses into 3-4 applications; do not dump urea all at once.",
                    "Drain excess standing water periodically."
                ]
            },
            {
                "id": "rice-bacterial-leaf-blight",
                "crop": "Rice",
                "common_name": "Bacterial Leaf Blight (BLB)",
                "hindi_name": "जीवाणु झुलसा (BLB)",
                "marathi_name": "जिवाणूजन्य करपा",
                "tamil_name": "பாக்டீரியா இலைக்கருகல்",
                "scientific_name": "Xanthomonas oryzae pv. oryzae",
                "affected_part": "leaf",
                "symptoms": ["yellow_margins", "wavy_edges", "drying_straw", "bacterial_ooze"],
                "description": "Water-soaked stripes along leaf margins enlarging to wavy yellow-orange lesions that turn dirty straw-white.",
                "favorable_weather": "Heavy rains, cyclones, high humidity (80-90%), temp 25-34°C.",
                "severity": "High",
                "chemical_control": {
                    "active_ingredient": "Copper Oxychloride 50% WP + Streptocycline",
                    "brand_examples": "Blitox 50 + Plantomycin",
                    "dose_per_liter": "2.5 g Copper Oxychloride + 0.15 g Streptocycline",
                    "dose_per_acre": "500 g Blitox + 30 g Streptocycline in 200 Liters water",
                    "application_instructions": "Foliar spray targeting infected canopy during non-rainy window.",
                    "phi_days": 21
                },
                "organic_control": {
                    "remedy": "Fermented Cow Dung & Cow Urine Extract",
                    "preparation": "Filter 5 kg fresh cow dung + 5 L urine soaked for 24h, dilute in 100 L water.",
                    "application": "Spray twice with a 10-day interval."
                },
                "preventive_practices": [
                    "Avoid clipping seedling tips during transplanting.",
                    "Apply adequate Potassium (Murate of Potash) to reinforce plant cell walls."
                ]
            },

            # --- TOMATO ---
            {
                "id": "tomato-early-blight",
                "crop": "Tomato",
                "common_name": "Early Blight",
                "hindi_name": "टमाटर अगेती झुलसा (Early Blight)",
                "marathi_name": "टोमॅटो लवकर येणारा करपा",
                "tamil_name": "தக்காளி ஆரம்ப கருகல் நோய்",
                "scientific_name": "Alternaria solani",
                "affected_part": "leaf",
                "symptoms": ["concentric_rings", "brown_blight", "yellow_halo", "target_spots"],
                "description": "Dark brown to black spots with concentric rings ('target-board' pattern) on older lower leaves, surrounded by yellow chlorotic halo.",
                "favorable_weather": "Warm temperatures (24-29°C) alternating with rain or heavy dew.",
                "severity": "Moderate",
                "chemical_control": {
                    "active_ingredient": "Mancozeb 75% WP",
                    "brand_examples": "Dithane M-45, Indofil M-45",
                    "dose_per_liter": "2.5 g",
                    "dose_per_acre": "500 g in 200 Liters water",
                    "application_instructions": "Spray early upon spotting lower leaf lesions; repeat at 10-14 day intervals.",
                    "phi_days": 15
                },
                "organic_control": {
                    "remedy": "Bordeaux Mixture 1% or Trichoderma viride",
                    "preparation": "100 g Copper Sulphate + 100 g Slaked Lime in 10 Liters water.",
                    "application": "Spray on both upper and underside of leaves."
                },
                "preventive_practices": [
                    "Prune off lowest leaves touching soil.",
                    "Use drip irrigation instead of overhead sprinklers to keep foliage dry."
                ]
            },
            {
                "id": "tomato-late-blight",
                "crop": "Tomato",
                "common_name": "Late Blight",
                "hindi_name": "टमाटर पछेती झुलसा (Late Blight)",
                "marathi_name": "टोमॅटो उशिरा येणारा करपा",
                "tamil_name": "தக்காளி பிந்தைய கருகல் நோய்",
                "scientific_name": "Phytophthora infestans",
                "affected_part": "leaf",
                "symptoms": ["water_soaked_spots", "white_mold_underside", "black_rot", "rapid_wilting"],
                "description": "Rapidly enlarging dark, water-soaked oily lesions on foliage and stems with delicate white fungal mold under leaves during high humidity.",
                "favorable_weather": "Cool (15-22°C), overcast, foggy weather with > 90% humidity.",
                "severity": "Critical",
                "chemical_control": {
                    "active_ingredient": "Metalaxyl 8% + Mancozeb 64% WP",
                    "brand_examples": "Ridomil Gold, Krilaxyl",
                    "dose_per_liter": "2.5 g",
                    "dose_per_acre": "500 g in 200 Liters water",
                    "application_instructions": "Emergency systemic spray. Must be applied immediately upon identification before complete plant collapse.",
                    "phi_days": 14
                },
                "organic_control": {
                    "remedy": "Copper Hydroxide Spray",
                    "preparation": "Copper Hydroxide 53.8% DF @ 2 g/L.",
                    "application": "Cover entire canopy before rains."
                },
                "preventive_practices": [
                    "Destroy infected crop debris immediately.",
                    "Ensure wide row spacing (60 x 45 cm) for air circulation."
                ]
            },
            {
                "id": "tomato-leaf-curl-virus",
                "crop": "Tomato",
                "common_name": "Tomato Leaf Curl Virus (ToLCV)",
                "hindi_name": "टमाटर पत्ता मरोड़ (Leaf Curl Virus)",
                "marathi_name": "टोमॅटो पर्णकुंचन (चुरडा-मुरडा)",
                "tamil_name": "தக்காளி இலை சுருட்டு வைரஸ்",
                "scientific_name": "Begomovirus (transmitted by Whitefly)",
                "affected_part": "leaf",
                "symptoms": ["leaf_curl", "upward_cupping", "stunting", "yellow_veins"],
                "description": "Severe upward and inward rolling and curling of leaves, thick leathery texture, yellowing of margins, and severe bush stunting.",
                "favorable_weather": "Hot, dry conditions favoring whitefly (Bemisia tabaci) population surge.",
                "severity": "Critical",
                "chemical_control": {
                    "active_ingredient": "Diafenthiuron 50% WP or Acetamiprid 20% SP",
                    "brand_examples": "Pegasus, Pride, Manik",
                    "dose_per_liter": "1.0 g (Diafenthiuron) OR 0.4 g (Acetamiprid)",
                    "dose_per_acre": "200 g in 200 Liters water",
                    "application_instructions": "Controls whitefly insect vectors that spread the virus.",
                    "phi_days": 10
                },
                "organic_control": {
                    "remedy": "Yellow Sticky Traps + Neem Oil 10,000 PPM",
                    "preparation": "Install 15 yellow sticky traps per acre; spray Neem oil @ 3 ml/L.",
                    "application": "Place traps 30 cm above crop canopy."
                },
                "preventive_practices": [
                    "Rogue out and bury infected plants immediately to prevent field spread.",
                    "Grow barrier crops like maize or sorghum around tomato plots."
                ]
            },

            # --- POTATO ---
            {
                "id": "potato-late-blight",
                "crop": "Potato",
                "common_name": "Potato Late Blight",
                "hindi_name": "आलू का पछेती झुलसा (Late Blight)",
                "marathi_name": "बटाटा उशिरा येणारा करपा",
                "tamil_name": "உருளைக்கிழங்கு பிந்தைய கருகல்",
                "scientific_name": "Phytophthora infestans",
                "affected_part": "leaf",
                "symptoms": ["water_soaked_spots", "black_rot", "white_mold_underside", "tuber_rot"],
                "description": "Water-soaked irregular black/brown lesions starting at leaf margins and tips. Tubers develop dry brownish rot.",
                "favorable_weather": "RH > 85%, night temp 10-15°C, day temp 20-22°C with persistent fog.",
                "severity": "Critical",
                "chemical_control": {
                    "active_ingredient": "Dimethomorph 50% WP + Mancozeb 75% WP",
                    "brand_examples": "Acrobat + Dithane M-45",
                    "dose_per_liter": "1.0 g Dimethomorph + 2.0 g Mancozeb",
                    "dose_per_acre": "200 g Acrobat + 400 g Mancozeb in 200 Liters water",
                    "application_instructions": "Apply upon first weather advisory alert before symptoms explode.",
                    "phi_days": 21
                },
                "organic_control": {
                    "remedy": "Bordeaux Mixture 1%",
                    "preparation": "1% neutral Bordeaux mixture applied with knapsack sprayer.",
                    "application": "Spray pre-infection."
                },
                "preventive_practices": [
                    "Earthing up to depth of 10-15 cm to protect tubers from wash-down spores.",
                    "De-haulm (cut foliage) 10-12 days prior to harvest if late blight is active."
                ]
            },

            # --- COTTON ---
            {
                "id": "cotton-pink-bollworm",
                "crop": "Cotton",
                "common_name": "Pink Bollworm",
                "hindi_name": "गुलाबी सुंडी (Pink Bollworm)",
                "marathi_name": "गुलाबी बोंडअळी",
                "tamil_name": "பருத்தி இளஞ்சிவப்பு காய்ப்புழு",
                "scientific_name": "Pectinophora gossypiella",
                "affected_part": "fruit",
                "symptoms": ["holes", "rosette_flower", "stained_lint", "internal_tunneling"],
                "description": "Larvae bore into cotton squares and bolls, causing rosette flowers (petals twisted), premature boll shedding, and stained discolored lint.",
                "favorable_weather": "High humidity, delayed rains, extended crop duration.",
                "severity": "Critical",
                "chemical_control": {
                    "active_ingredient": "Chlorantraniliprole 18.5% SC or Emamectin Benzoate 5% SG",
                    "brand_examples": "Coragen, Proclaim",
                    "dose_per_liter": "0.3 ml (Coragen) OR 0.4 g (Proclaim)",
                    "dose_per_acre": "60 ml Coragen in 200 Liters water",
                    "application_instructions": "Spray when 1 out of 10 bolls shows exit holes or when pheromone trap catches 8 moths/night for 3 consecutive days.",
                    "phi_days": 21
                },
                "organic_control": {
                    "remedy": "Pheromone Traps + Trichogramma Chilonis Cards",
                    "preparation": "Install 5-8 delta pheromone traps/acre with Pectino-lure.",
                    "application": "Release egg parasitoid Trichogramma @ 60,000 eggs/acre every 10 days."
                },
                "preventive_practices": [
                    "Terminate crop by mid-January; avoid ratoon cotton.",
                    "Install light traps to capture adult moths."
                ]
            },
            {
                "id": "cotton-whitefly",
                "crop": "Cotton",
                "common_name": "Whitefly & Sooty Mold",
                "hindi_name": "सफेद मक्खी (Whitefly)",
                "marathi_name": "पांढरी माशी",
                "tamil_name": "வெள்ளை ஈ",
                "scientific_name": "Bemisia tabaci",
                "affected_part": "leaf",
                "symptoms": ["leaf_curl", "honeydew_black_soot", "chlorosis", "stunting"],
                "description": "Nymphs and adults suck cell sap from undersides of leaves, excreting sticky honeydew which turns leaves black with sooty mold.",
                "favorable_weather": "Dry, warm spell (32-38°C) with low rainfall.",
                "severity": "High",
                "chemical_control": {
                    "active_ingredient": "Pyriproxyfen 10% + Bifenthrin 10% EC",
                    "brand_examples": "Lano, Dursban",
                    "dose_per_liter": "2.0 ml",
                    "dose_per_acre": "400 ml in 200 Liters water",
                    "application_instructions": "Spray targeting underside of canopy using hollow-cone nozzle.",
                    "phi_days": 15
                },
                "organic_control": {
                    "remedy": "Neem Oil 10,000 PPM + Yellow Sticky Sheets",
                    "preparation": "Spray 3 ml/L cold-pressed Neem Oil with 0.5 ml surfactant.",
                    "application": "Install 20 yellow sticky sheets per acre."
                },
                "preventive_practices": [
                    "Avoid synthetic pyrethroids early in season which cause whitefly resurgence.",
                    "Keep borders free from weeds like Abutilon and Parthenium."
                ]
            },

            # --- ONION ---
            {
                "id": "onion-purple-blotch",
                "crop": "Onion",
                "common_name": "Purple Blotch",
                "hindi_name": "प्याज का बैंगनी धब्बा (Purple Blotch)",
                "marathi_name": "कांद्यावरील जांभळा करपा",
                "tamil_name": "வெங்காய ஊதா கருகல் நோய்",
                "scientific_name": "Alternaria porri",
                "affected_part": "leaf",
                "symptoms": ["purple_spots", "sunken_lesions", "yellow_halo", "leaf_drying"],
                "description": "Small, water-soaked lesions that quickly develop dark purple/brown centers surrounded by yellow halos, girdling the leaf blade.",
                "favorable_weather": "Warm humid conditions (25-30°C) with RH 80-90%.",
                "severity": "High",
                "chemical_control": {
                    "active_ingredient": "Difenoconazole 25% EC",
                    "brand_examples": "Score, Difeno",
                    "dose_per_liter": "1.0 ml",
                    "dose_per_acre": "200 ml in 200 Liters water",
                    "application_instructions": "Add sticker/spreader (0.5 ml/L) since onion foliage has a waxy cuticle.",
                    "phi_days": 14
                },
                "organic_control": {
                    "remedy": "Pseudomonas fluorescens 1% WP Spray",
                    "preparation": "5 g/L with jaggery water surfactant.",
                    "application": "Spray foliage every 12 days."
                },
                "preventive_practices": [
                    "Ensure excellent soil drainage to prevent standing water.",
                    "Adopt 3-year crop rotation without allium crops."
                ]
            },

            # --- MUSTARD ---
            {
                "id": "mustard-white-rust",
                "crop": "Mustard",
                "common_name": "White Rust / Blister",
                "hindi_name": "सफेद रतुआ (White Rust)",
                "marathi_name": "पांढरा तांबेरा",
                "tamil_name": "வெள்ளை துரு நோய்",
                "scientific_name": "Albugo candida",
                "affected_part": "leaf",
                "symptoms": ["white_blisters", "staghead_deformation", "yellow_spots"],
                "description": "Prominent chalk-white, raised pustules/blisters on the underside of leaves and floral malformation ('staghead').",
                "favorable_weather": "Cool (12-18°C) and moist weather with heavy morning dew.",
                "severity": "Moderate",
                "chemical_control": {
                    "active_ingredient": "Mancozeb 75% WP or Metalaxyl 35% WS",
                    "brand_examples": "Ridomil, Dithane M-45",
                    "dose_per_liter": "2.0 g Mancozeb",
                    "dose_per_acre": "400 g in 200 Liters water",
                    "application_instructions": "Spray at 45 and 60 days after sowing.",
                    "phi_days": 21
                },
                "organic_control": {
                    "remedy": "Garlic bulb extract spray (5%)",
                    "preparation": "Crush 50g fresh garlic in 1 L water, filter and spray.",
                    "application": "Foliar application on sunny days."
                },
                "preventive_practices": [
                    "Early sowing (first fortnight of October) escapes severe staghead phase.",
                    "Seed treatment with Metalaxyl @ 6 g/kg seed."
                ]
            },

            # --- SOYBEAN ---
            {
                "id": "soybean-yellow-mosaic",
                "crop": "Soybean",
                "common_name": "Yellow Mosaic Virus (YMV)",
                "hindi_name": "पीला मोज़ेक वायरस (YMV)",
                "marathi_name": "सोयाबीन पिवळा मोझॅक",
                "tamil_name": "சோயாபீன் மஞ்சள் மொசைக்",
                "scientific_name": "Mungbean Yellow Mosaic India Virus (MYMIV)",
                "affected_part": "leaf",
                "symptoms": ["yellow_patches", "mosaic_pattern", "stunting", "shriveled_seeds"],
                "description": "Bright yellow patches interspersed with green on leaf blade, progressing into complete chlorosis and stunted pods.",
                "favorable_weather": "Hot, humid conditions promoting whitefly vectors.",
                "severity": "Critical",
                "chemical_control": {
                    "active_ingredient": "Thiamethoxam 25% WG",
                    "brand_examples": "Actara, Renova",
                    "dose_per_liter": "0.5 g",
                    "dose_per_acre": "100 g in 200 Liters water",
                    "application_instructions": "Foliar spray targeted at vector control within 20-25 days of sowing.",
                    "phi_days": 21
                },
                "organic_control": {
                    "remedy": "Agniastra Bio-Pesticide",
                    "preparation": "Decoction of neem leaves, crushed green chilies, and garlic in cow urine.",
                    "application": "Spray @ 25 ml per 15-liter spray pump."
                },
                "preventive_practices": [
                    "Sow YMV resistant varieties: JS 20-34, JS 20-29, NRC 37.",
                    "Uproot and destroy initial virus-infected plants within first 3 weeks."
                ]
            }
        ]

    def diagnose(self, crop: str, affected_part: Optional[str], symptoms: List[str]) -> List[Dict[str, Any]]:
        """
        Calculates diagnostic confidence match scores based on crop, affected plant part,
        and observed visual symptoms.
        """
        crop_clean = (crop or "").strip().capitalize()
        symptom_set = set([s.lower().strip() for s in symptoms if s])
        results = []

        for d in self.diseases_db:
            # Crop match is the primary filter
            if crop_clean and d["crop"].lower() != crop_clean.lower():
                continue

            score = 0
            max_score = 100

            # Part match: +25%
            part_matched = False
            if affected_part and d["affected_part"].lower() == affected_part.lower():
                score += 25
                part_matched = True
            elif not affected_part:
                score += 15  # partial credit if part not specified

            # Symptoms matching: up to 60%
            disease_symptoms = set(d["symptoms"])
            matching_symptoms = symptom_set.intersection(disease_symptoms)
            if disease_symptoms:
                symptom_ratio = len(matching_symptoms) / len(disease_symptoms)
                score += int(symptom_ratio * 60)

            # Extra weight if user selected strong key indicators
            if len(matching_symptoms) >= 2:
                score += 15

            score = min(98, max(25, score))

            results.append({
                "disease": d,
                "confidence_pct": score,
                "matching_symptoms": list(matching_symptoms),
                "part_matched": part_matched
            })

        # Sort by highest confidence
        results.sort(key=lambda x: x["confidence_pct"], reverse=True)
        return results[:5]

    def calculate_dosage(self, disease_id: str, acres: float, spray_liters_per_acre: float = 200.0) -> Dict[str, Any]:
        """
        Calculates exact chemical requirement, spray tank volume, and water needed
        for the farmer's specific acreage.
        """
        disease = next((d for d in self.diseases_db if d["id"] == disease_id), None)
        if not disease:
            # Fallback to general dosage formula
            total_water = acres * spray_liters_per_acre
            return {
                "acres": acres,
                "total_spray_water_liters": round(total_water, 1),
                "knapsack_tanks_15L": math.ceil(total_water / 15.0),
                "battery_tanks_20L": math.ceil(total_water / 20.0),
                "chemical_product_required": f"~{int(acres * 250)} ml/g",
                "active_ingredient": "Standard Fungicide / Insecticide",
                "phi_days": 14
            }

        total_water = acres * spray_liters_per_acre
        chem = disease["chemical_control"]
        
        # Calculate chemical requirement
        chem_dose_str = chem.get("dose_per_acre", "")
        
        return {
            "disease_id": disease["id"],
            "disease_name": disease["common_name"],
            "hindi_name": disease["hindi_name"],
            "acres": acres,
            "total_spray_water_liters": round(total_water, 1),
            "knapsack_tanks_15L": math.ceil(total_water / 15.0),
            "battery_tanks_20L": math.ceil(total_water / 20.0),
            "active_ingredient": chem["active_ingredient"],
            "brand_examples": chem["brand_examples"],
            "dose_per_liter": chem["dose_per_liter"],
            "total_product_for_farm": f"{chem_dose_str.split(' in ')[0]} x {acres:.1f} = calculated on dispatch",
            "application_instructions": chem["application_instructions"],
            "phi_days": chem.get("phi_days", 14),
            "organic_remedy": disease["organic_control"]["remedy"],
            "organic_preparation": disease["organic_control"]["preparation"]
        }

    def get_all_diseases(self, crop: Optional[str] = None) -> List[Dict[str, Any]]:
        if crop:
            return [d for d in self.diseases_db if d["crop"].lower() == crop.lower()]
        return self.diseases_db

crop_doctor_service = CropDoctorService()
