"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  diagnoseDisease,
  calculateDosage,
  fetchSymptomsCatalog,
  DiagnosisResult,
  DosageCalculation,
} from "@/lib/crop_doctor_api";
import {
  Stethoscope,
  ShieldAlert,
  AlertTriangle,
  Droplets,
  Volume2,
  VolumeX,
  Sparkles,
  Calculator,
  Leaf,
  CheckCircle2,
  ArrowRight,
  UploadCloud,
  FileCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const CROPS = [
  "Wheat",
  "Rice",
  "Tomato",
  "Potato",
  "Cotton",
  "Onion",
  "Mustard",
  "Soybean",
  "Maize",
  "Chickpea",
];

const PLANT_PARTS = [
  { id: "leaf", labelKey: "doctor.leaf", fallback: "Leaf", icon: "🍃" },
  { id: "fruit", labelKey: "doctor.fruit", fallback: "Fruit / Pod", icon: "🍅" },
  { id: "stem", labelKey: "doctor.stem", fallback: "Stem", icon: "🎋" },
  { id: "root", labelKey: "doctor.root", fallback: "Root", icon: "🌱" },
];

export default function CropDoctor() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [selectedCrop, setSelectedCrop] = useState<string>(user?.crop || "Wheat");
  const [selectedPart, setSelectedPart] = useState<string>("leaf");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(["yellow_spots"]);
  const [symptomsCatalog, setSymptomsCatalog] = useState<Record<string, any>>({});
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>([]);
  const [activeDiagnosis, setActiveDiagnosis] = useState<DiagnosisResult | null>(null);

  // Dosage calculator state
  const [farmAcres, setFarmAcres] = useState<number>(user?.acres ? Number(user.acres) : 3.0);
  const [dosageInfo, setDosageInfo] = useState<DosageCalculation | null>(null);

  // Voice playback state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Leaf photo scanner simulator state
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [scannedFileName, setScannedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (user?.crop) setSelectedCrop(user.crop);
    if (user?.acres) setFarmAcres(Number(user.acres));
  }, [user]);

  // Fetch catalog on load
  useEffect(() => {
    fetchSymptomsCatalog().then((data) => {
      if (data) setSymptomsCatalog(data);
    });
  }, []);

  // Run initial diagnosis on mount
  useEffect(() => {
    runDiagnosis(selectedCrop, selectedPart, selectedSymptoms);
  }, [selectedCrop, selectedPart]);

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptomId)
        ? prev.filter((s) => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const runDiagnosis = async (crop: string, part: string, symptoms: string[]) => {
    setIsDiagnosing(true);
    try {
      const results = await diagnoseDisease(crop, part, symptoms);
      setDiagnoses(results);
      if (results.length > 0) {
        setActiveDiagnosis(results[0]);
        updateDosage(results[0].disease.id, farmAcres);
      } else {
        setActiveDiagnosis(null);
        setDosageInfo(null);
      }
    } catch (err) {
      toast.error("Failed to diagnose symptoms.");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const updateDosage = async (diseaseId: string, acres: number) => {
    if (!diseaseId) return;
    const info = await calculateDosage(diseaseId, acres);
    if (info) setDosageInfo(info);
  };

  const handleAcresChange = (acres: number) => {
    const validAcres = Math.max(0.25, Math.min(100, acres));
    setFarmAcres(validAcres);
    if (activeDiagnosis) {
      updateDosage(activeDiagnosis.disease.id, validAcres);
    }
  };

  const handlePhotoScan = () => {
    setIsScanningPhoto(true);
    setScannedFileName("field_leaf_sample_01.jpg");
    setTimeout(() => {
      setIsScanningPhoto(false);
      // Auto-populate relevant symptoms based on current crop
      if (selectedCrop === "Wheat") {
        setSelectedSymptoms(["yellow_spots", "rust_pustules"]);
      } else if (selectedCrop === "Tomato") {
        setSelectedSymptoms(["concentric_rings", "brown_blight"]);
      } else if (selectedCrop === "Cotton") {
        setSelectedPart("fruit");
        setSelectedSymptoms(["holes"]);
      } else {
        setSelectedSymptoms(["yellow_spots", "water_soaked_spots"]);
      }
      toast.success("AI Leaf Scanner completed! Symptoms identified.");
    }, 1400);
  };

  const toggleVoiceReadout = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Audio playback is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langLocales: Record<string, string> = {
      hi: "hi-IN",
      mr: "mr-IN",
      ta: "ta-IN",
      en: "en-IN",
    };
    const targetLang = langLocales[language] || "en-IN";
    utterance.lang = targetLang;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(
      (v) => v.lang.toLowerCase() === targetLang.toLowerCase() || v.lang.startsWith(language)
    );
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const availableSymptoms = symptomsCatalog[selectedPart] || [];

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-8 max-w-[1200px] w-full mx-auto pb-16">
        {/* Header */}
        <section className="flex flex-col items-start gap-1 w-full border-b border-[#D9CEB8] pb-4">
          <div className="flex items-center justify-between w-full">
            <span className="uppercase tracking-[0.14em] text-[#5C7A52] text-[10px] font-semibold border-b-[0.5px] border-[#C9A97A] pb-1 flex items-center gap-2">
              <Stethoscope size={14} className="text-[#5C7A52]" />
              AgriSense Crop Pathology
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE3D2] border border-[#D9CEB8] text-[11px] font-medium text-[#7A3B2E]">
              <span className="w-2 h-2 rounded-full bg-[#7A3B2E] animate-pulse"></span>
              CIBRC-Certified Dosages
            </span>
          </div>
          <h1 className="font-display font-semibold text-[26px] sm:text-[30px] text-[#2C2416] mt-1">
            {t("doctor.title")}
          </h1>
          <p className="font-body text-[#7A6A55] text-[13px] sm:text-[14px]">
            {t("doctor.subtitle")}
          </p>
        </section>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Diagnostics Input Panel (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-[#FDFAF4] border border-[#D9CEB8] rounded-[16px] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D9CEB8]/70 pb-3">
              <h2 className="font-display font-semibold text-[17px] text-[#2C2416] flex items-center gap-2">
                <Leaf size={18} className="text-[#5C7A52]" />
                {t("doctor.symptomStep")}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedSymptoms(["yellow_spots"]);
                  setScannedFileName(null);
                }}
                className="text-[11px] text-[#7A6A55] hover:text-[#7A3B2E] flex items-center gap-1"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>

            {/* 1. Crop Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-[#2C2416] uppercase tracking-wider">
                {t("common.crop")}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {CROPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCrop(c)}
                    className={`px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
                      selectedCrop === c
                        ? "bg-[#2D4A22] text-white shadow-xs font-semibold"
                        : "bg-[#F5F1EA] text-[#7A6A55] hover:bg-[#EAE3D2] border border-[#D9CEB8]/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Plant Part Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-[#2C2416] uppercase tracking-wider">
                {t("doctor.affectedPart")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLANT_PARTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPart(p.id)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-[10px] text-[12px] font-medium border transition-all ${
                      selectedPart === p.id
                        ? "bg-[#7A3B2E] text-white border-[#7A3B2E] shadow-xs"
                        : "bg-[#F5F1EA] text-[#2C2416] border-[#D9CEB8] hover:bg-[#EAE3D2]"
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{t(p.labelKey, p.fallback)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. AI Leaf Photo Scanner Simulation */}
            <div className="border border-dashed border-[#C9A97A] rounded-[12px] p-4 bg-[#FBF7F0] flex flex-col items-center justify-center text-center gap-2 relative overflow-hidden">
              {isScanningPhoto && (
                <div className="absolute inset-0 bg-[#2D4A22]/10 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-10">
                  <div className="w-10 h-10 border-3 border-[#5C7A52] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[12px] font-medium text-[#2D4A22] animate-pulse">
                    AI Pathology Vision Analyzing Leaf...
                  </span>
                </div>
              )}
              <UploadCloud size={28} className="text-[#7A3B2E]" />
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-[#2C2416]">
                  {scannedFileName ? scannedFileName : "Upload Leaf Photo or Scan Sample"}
                </span>
                <span className="text-[11px] text-[#7A6A55]">
                  Instant foliar lesion extraction & neural pathology matching
                </span>
              </div>
              <button
                type="button"
                onClick={handlePhotoScan}
                disabled={isScanningPhoto}
                className="mt-1 px-4 py-1.5 bg-[#7A3B2E] text-white text-[11px] font-medium rounded-full hover:bg-[#632c21] transition-colors shadow-xs"
              >
                {scannedFileName ? "Scan Another Leaf" : "Scan Sample Leaf"}
              </button>
            </div>

            {/* 4. Symptom Chips */}
            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-medium text-[#2C2416] uppercase tracking-wider flex items-center justify-between">
                <span>{t("doctor.selectSymptoms")}</span>
                <span className="text-[11px] text-[#5C7A52] font-normal">
                  ({selectedSymptoms.length} selected)
                </span>
              </label>

              <div className="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto pr-1">
                {availableSymptoms.map((sym: any) => {
                  const isSelected = selectedSymptoms.includes(sym.id);
                  const label = sym[language] || sym.en;
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => toggleSymptom(sym.id)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#5C7A52] text-white border-[#5C7A52] shadow-xs"
                          : "bg-white text-[#2C2416] border-[#D9CEB8] hover:bg-[#F5F1EA]"
                      }`}
                    >
                      {isSelected && <CheckCircle2 size={13} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Submit */}
            <button
              type="button"
              onClick={() => runDiagnosis(selectedCrop, selectedPart, selectedSymptoms)}
              disabled={isDiagnosing || selectedSymptoms.length === 0}
              className="w-full py-3 bg-[#2D4A22] text-white rounded-[12px] font-medium text-[14px] hover:bg-[#233b1a] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Sparkles size={16} />
              {isDiagnosing ? t("doctor.diagnosing") : t("doctor.diagnoseBtn")}
            </button>
          </div>

          {/* Right Column: Prescription & Dosage Output (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Top Match Card */}
            {activeDiagnosis ? (
              <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-[16px] p-6 shadow-sm flex flex-col gap-6 relative">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9CEB8]/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#EDE3D3] text-[#7A3B2E] px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider">
                        {activeDiagnosis.disease.severity} Severity
                      </span>
                      <span className="text-[12px] text-[#5C7A52] font-semibold flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        {activeDiagnosis.confidence_pct}% {t("doctor.matchConfidence")}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-[22px] text-[#2C2416] mt-1">
                      {activeDiagnosis.disease.common_name}
                    </h3>
                    <p className="text-[12px] italic text-[#7A6A55]">
                      {activeDiagnosis.disease.scientific_name} · {activeDiagnosis.disease.hindi_name}
                    </p>
                  </div>

                  {/* Audio Readout Button */}
                  <button
                    type="button"
                    onClick={() =>
                      toggleVoiceReadout(
                        `${activeDiagnosis.disease.common_name}. ${activeDiagnosis.disease.description} Recommended chemical control: ${activeDiagnosis.disease.chemical_control.active_ingredient}, apply ${activeDiagnosis.disease.chemical_control.dose_per_liter} of water. ${activeDiagnosis.disease.chemical_control.application_instructions}`
                      )
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all flex-shrink-0 ${
                      isSpeaking
                        ? "bg-[#7A3B2E] text-white border-[#7A3B2E] animate-pulse"
                        : "bg-white text-[#5C7A52] border-[#D9CEB8] hover:bg-[#EAE3D2]"
                    }`}
                  >
                    {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isSpeaking ? t("advisor.stopAudio") : t("doctor.listenAudio")}</span>
                  </button>
                </div>

                {/* Description & Weather Warning */}
                <div className="bg-[#F5F1EA] rounded-[10px] p-3.5 border border-[#D9CEB8]/70 flex flex-col gap-1.5 text-[13px] text-[#2C2416]">
                  <p className="leading-relaxed">{activeDiagnosis.disease.description}</p>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#7A3B2E] font-medium pt-1">
                    <AlertTriangle size={14} />
                    <span>Favorable Weather Trigger: {activeDiagnosis.disease.favorable_weather}</span>
                  </div>
                </div>

                {/* CIBRC Chemical Control Box */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-display font-semibold text-[15px] text-[#2C2416] flex items-center gap-2">
                    <ShieldAlert size={17} className="text-[#7A3B2E]" />
                    {t("doctor.cibrcChemical")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white border border-[#D9CEB8] rounded-[10px] p-3">
                      <span className="text-[11px] text-[#7A6A55] uppercase font-semibold block">
                        Active Ingredient
                      </span>
                      <span className="text-[13px] font-semibold text-[#2C2416]">
                        {activeDiagnosis.disease.chemical_control.active_ingredient}
                      </span>
                      <span className="text-[11px] text-[#7A6A55] block mt-1">
                        Brand Examples: {activeDiagnosis.disease.chemical_control.brand_examples}
                      </span>
                    </div>

                    <div className="bg-white border border-[#D9CEB8] rounded-[10px] p-3">
                      <span className="text-[11px] text-[#7A6A55] uppercase font-semibold block">
                        Dilution Ratio
                      </span>
                      <span className="text-[13px] font-semibold text-[#2D4A22]">
                        {activeDiagnosis.disease.chemical_control.dose_per_liter} per Liter of water
                      </span>
                      <span className="text-[11px] text-[#7A3B2E] font-medium block mt-1">
                        PHI Waiting Period: {activeDiagnosis.disease.chemical_control.phi_days} Days before harvest
                      </span>
                    </div>
                  </div>
                  <p className="text-[12px] text-[#7A6A55] leading-relaxed italic bg-white/60 p-2.5 rounded-[8px] border border-[#D9CEB8]/40">
                    ℹ️ Instructions: {activeDiagnosis.disease.chemical_control.application_instructions}
                  </p>
                </div>

                {/* Acreage Dosage Calculator */}
                <div className="bg-[#EFE9DD] border border-[#C9A97A] rounded-[12px] p-4 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C9A97A]/40 pb-2">
                    <div className="flex items-center gap-2">
                      <Calculator size={18} className="text-[#5C7A52]" />
                      <span className="font-display font-semibold text-[15px] text-[#2C2416]">
                        {t("doctor.dosageCalculator")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#7A6A55]">Farm Area:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="50"
                        value={farmAcres}
                        onChange={(e) => handleAcresChange(parseFloat(e.target.value) || 1)}
                        className="w-16 px-2 py-1 bg-white border border-[#D9CEB8] rounded-[6px] text-[13px] font-semibold text-center text-[#2C2416] outline-none"
                      />
                      <span className="text-[12px] font-semibold text-[#2C2416]">Acres</span>
                    </div>
                  </div>

                  {dosageInfo && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-center">
                      <div className="bg-white/90 rounded-[8px] p-2.5 border border-[#D9CEB8]">
                        <span className="text-[10px] text-[#7A6A55] uppercase block font-semibold">
                          Spray Water Volume
                        </span>
                        <span className="text-[16px] font-bold text-[#2D4A22] block">
                          {dosageInfo.total_spray_water_liters} L
                        </span>
                        <span className="text-[10px] text-[#7A6A55]">200 L / acre standard</span>
                      </div>

                      <div className="bg-white/90 rounded-[8px] p-2.5 border border-[#D9CEB8]">
                        <span className="text-[10px] text-[#7A6A55] uppercase block font-semibold">
                          Knapsack Tanks (15L)
                        </span>
                        <span className="text-[16px] font-bold text-[#7A3B2E] block">
                          ~{dosageInfo.knapsack_tanks_15L} Tanks
                        </span>
                        <span className="text-[10px] text-[#7A6A55]">Manual pump fill</span>
                      </div>

                      <div className="bg-white/90 rounded-[8px] p-2.5 border border-[#D9CEB8]">
                        <span className="text-[10px] text-[#7A6A55] uppercase block font-semibold">
                          Battery Tanks (20L)
                        </span>
                        <span className="text-[16px] font-bold text-[#5C7A52] block">
                          ~{dosageInfo.battery_tanks_20L} Tanks
                        </span>
                        <span className="text-[10px] text-[#7A6A55]">Motorized pump fill</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organic & Biological Control */}
                <div className="flex flex-col gap-2 bg-[#F1F6EF] border border-[#A8C4A1] rounded-[10px] p-4">
                  <span className="font-display font-semibold text-[14px] text-[#2D4A22] flex items-center gap-1.5">
                    <Leaf size={16} className="text-[#5C7A52]" />
                    {t("doctor.organicRemedy")}
                  </span>
                  <span className="text-[13px] font-semibold text-[#2C2416]">
                    {activeDiagnosis.disease.organic_control.remedy}
                  </span>
                  <p className="text-[12px] text-[#556B4D] leading-relaxed">
                    📝 {activeDiagnosis.disease.organic_control.preparation}
                  </p>
                </div>

                {/* Bottom Consult AI Advisor */}
                <div className="flex items-center justify-between border-t border-[#D9CEB8]/70 pt-4">
                  <span className="text-[12px] text-[#7A6A55]">
                    Need custom guidance for your specific plot?
                  </span>
                  <Link
                    href="/advisor"
                    className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#5C7A52] hover:text-[#2D4A22] transition-colors"
                  >
                    {t("doctor.askAdvisor")} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-[16px] p-12 text-center flex flex-col items-center justify-center gap-3">
                <Stethoscope size={36} className="text-[#C9A97A]" />
                <h3 className="font-display font-semibold text-[18px] text-[#2C2416]">
                  Select Crop Symptoms to Begin Diagnosis
                </h3>
                <p className="text-[13px] text-[#7A6A55] max-w-[400px]">
                  Pick your crop, affected part (leaf, fruit, stem, root), and observed patterns on the left panel. The AI Crop Doctor will generate a certified prescription.
                </p>
              </div>
            )}

            {/* Alternative Diagnoses List */}
            {diagnoses.length > 1 && (
              <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-[16px] p-5 flex flex-col gap-3">
                <span className="text-[12px] font-semibold uppercase text-[#7A6A55] tracking-wider">
                  Alternative Pathological Diagnoses
                </span>
                <div className="flex flex-col gap-2">
                  {diagnoses.slice(1).map((d) => (
                    <div
                      key={d.disease.id}
                      onClick={() => {
                        setActiveDiagnosis(d);
                        updateDosage(d.disease.id, farmAcres);
                      }}
                      className="p-3 rounded-[10px] bg-white border border-[#D9CEB8] hover:border-[#5C7A52] cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[13px] font-semibold text-[#2C2416] block">
                          {d.disease.common_name}
                        </span>
                        <span className="text-[11px] text-[#7A6A55]">
                          {d.disease.scientific_name}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F5F1EA] text-[#5C7A52]">
                        {d.confidence_pct}% Match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
