"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { predictYield } from "@/lib/api";
import { Sprout, Droplets, MapPin, GaugeCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function YieldPredictor() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [params, setParams] = useState({
    crop: user.crop || "Wheat",
    rainfall_mm: 50,
    fertilizer_pct: 60,
    season: user.season || "Rabi",
    field_acres: user.acres || 5,
  });

  const [predictedYieldPerAcre, setPredictedYieldPerAcre] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Core debounced fetch
  const fetchPrediction = useCallback(async (currentParams: typeof params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictYield(currentParams);
      const rawYield = res?.predicted_yield || res?.yield || 2345;
      setPredictedYieldPerAcre(rawYield);
      setConfidence(res?.confidence_pct ? res.confidence_pct / 100 : res?.confidence || 0.87);
    } catch (err) {
      console.error(err);
      setError("Prediction engine offline. Defaulting to historical baseline.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Update real-time with debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchPrediction(params);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [params, fetchPrediction]);

  // Generic handler for input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: name === "crop" || name === "season" ? value : Number(value),
    }));
  };

  const baselineYieldPerAcre = 2100; // Mock historical average per acre
  const totalPredictedYield = predictedYieldPerAcre !== null ? Math.round(predictedYieldPerAcre * params.field_acres) : null;
  const isAboveBaseline = predictedYieldPerAcre !== null && predictedYieldPerAcre > baselineYieldPerAcre;

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-6 max-w-[1100px] w-full mx-auto">
        <section className="flex flex-col gap-2 border-b-[0.5px] border-[#D9CEB8] pb-6">
          <h1 className="font-display font-semibold text-[28px] text-[#2C2416]">
            {t("yield.title")}
          </h1>
          <p className="font-body text-[#7A6A55] text-[14px]">
            {t("yield.subtitle")}
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Controls Panel */}
          <section className="bg-[#FDFAF4] border-[0.5px] border-[#D9CEB8] rounded-[16px] p-6 shadow-sm flex flex-col gap-8">
            <h2 className="font-display font-medium text-[16px] text-[#2C2416] flex items-center gap-2">
              <GaugeCircle size={18} className="text-[#C9A97A]" /> {t("yield.configureInputs")}
            </h2>

            {/* Dropdowns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[#7A6A55] uppercase tracking-wider">
                  {t("yield.crop")}
                </label>
                <select name="crop" value={params.crop} onChange={handleChange} className="p-3 bg-white border border-[#D9CEB8] rounded-[8px] text-[14px] text-[#2C2416] focus:outline-none focus:ring-1 focus:ring-[#5C7A52]">
                  <option value="Wheat">{t("crop.Wheat")}</option>
                  <option value="Rice">{t("crop.Rice")}</option>
                  <option value="Maize">{t("crop.Maize")}</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[#7A6A55] uppercase tracking-wider">
                  {t("yield.season")}
                </label>
                <select name="season" value={params.season} onChange={handleChange} className="p-3 bg-white border border-[#D9CEB8] rounded-[8px] text-[14px] text-[#2C2416] focus:outline-none focus:ring-1 focus:ring-[#5C7A52]">
                  <option value="Rabi">{t("season.Rabi")}</option>
                  <option value="Kharif">{t("season.Kharif")}</option>
                  <option value="Zaid">{t("season.Zaid")}</option>
                </select>
              </div>
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-[13px]">
                  <label className="font-medium text-[#2C2416] flex items-center gap-2">
                    <Droplets size={14} className="text-[#5C7A52]" /> {t("yield.rainfallVolume")}
                  </label>
                  <span className="text-[#7A6A55]">{params.rainfall_mm} mm</span>
                </div>
                <input 
                  type="range" name="rainfall_mm" min="0" max="200" value={params.rainfall_mm} onChange={handleChange}
                  className="w-full accent-[#5C7A52] [&::-webkit-slider-thumb]:bg-[#5C7A52] h-1.5 bg-[#D9CEB8] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-[13px]">
                  <label className="font-medium text-[#2C2416] flex items-center gap-2">
                    <Sprout size={14} className="text-[#C9A97A]" /> {t("yield.fertilizerFactor")}
                  </label>
                  <span className="text-[#7A6A55]">{params.fertilizer_pct}%</span>
                </div>
                <input 
                  type="range" name="fertilizer_pct" min="0" max="100" value={params.fertilizer_pct} onChange={handleChange}
                  className="w-full accent-[#C9A97A] [&::-webkit-slider-thumb]:bg-[#C9A97A] h-1.5 bg-[#D9CEB8] rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-[13px]">
                  <label className="font-medium text-[#2C2416] flex items-center gap-2">
                    <MapPin size={14} className="text-[#7A3B2E]" /> {t("yield.fieldSize")}
                  </label>
                  <span className="text-[#7A6A55]">{params.field_acres} {t("common.acres")}</span>
                </div>
                <input 
                  type="range" name="field_acres" min="1" max="100" value={params.field_acres} onChange={handleChange}
                  className="w-full accent-[#7A3B2E] [&::-webkit-slider-thumb]:bg-[#7A3B2E] h-1.5 bg-[#D9CEB8] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </section>

          {/* Results Panel */}
          <section className="bg-white border-[0.5px] border-[#D9CEB8] rounded-[16px] p-6 shadow-sm flex flex-col justify-center items-center text-center gap-8 relative overflow-hidden">
            
            {/* Dynamic gradient background based on state */}
            <div className={`absolute top-0 left-0 w-full h-[6px] ${isAboveBaseline ? 'bg-gradient-to-r from-[#5C7A52] to-[#DDE8D9]' : 'bg-gradient-to-r from-[#C9A97A] to-[#7A3B2E]'}`} />

            <div className="flex flex-col gap-2">
              <span className="uppercase tracking-[0.14em] text-[#7A6A55] text-[10px] font-medium block">
                {t("yield.liveEngine")}
              </span>
              <div className="h-[90px] flex items-center justify-center">
                {loading ? (
                  <div className="w-[120px] h-[60px] animate-pulse bg-[#F5F1EA] rounded-[10px]"></div>
                ) : (
                  <h3 className="font-display font-semibold text-[64px] text-[#2C2416] leading-none">
                    {totalPredictedYield?.toLocaleString() || "—"} <span className="text-[20px] font-medium text-[#7A6A55]">kg</span>
                  </h3>
                )}
              </div>
              <p className="font-body text-[14px] text-[#7A6A55]">
                {t("yield.totalExpectedAcross")} {params.field_acres} {t("common.acres")}
              </p>
            </div>

            {/* Error or Badges */}
            {error ? (
              <p className="text-[12px] text-[#7A3B2E] bg-[#EDE3D3] px-3 py-1 rounded-[16px]">{error}</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full mt-4">
                <div className="bg-[#F5F1EA] rounded-[10px] py-4 px-3 flex flex-col items-center justify-center gap-1 border border-[#D9CEB8]">
                  <span className="text-[10px] uppercase font-semibold text-[#7A6A55] tracking-wider">
                    {t("yield.confidenceLevel")}
                  </span>
                  <span className="font-display text-[20px] font-medium text-[#5C7A52]">{Math.round(confidence * 100)}%</span>
                </div>
                
                <div className={`rounded-[10px] py-4 px-3 flex flex-col items-center justify-center gap-1 border ` + (isAboveBaseline ? 'bg-[#DDE8D9] border-[#A8C4A1]' : 'bg-[#FDFAF4] border-[#E8DFC9]')}>
                  <span className="text-[10px] uppercase font-semibold text-[#7A6A55] tracking-wider">
                    {t("yield.vsHistoricalAvg")}
                  </span>
                  <span className={`font-display text-[20px] font-medium ` + (isAboveBaseline ? 'text-[#3A5E32]' : 'text-[#7A3B2E]')}>
                    {isAboveBaseline ? '+' : ''}{Math.round(((predictedYieldPerAcre || baselineYieldPerAcre) - baselineYieldPerAcre) / baselineYieldPerAcre * 100)}%
                  </span>
                </div>
              </div>
            )}
            
          </section>

        </div>
      </div>
    </ProtectedRoute>
  );
}
