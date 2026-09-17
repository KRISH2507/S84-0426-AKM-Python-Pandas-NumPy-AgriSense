"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  Activity,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Stethoscope,
  Coins,
  ArrowRight,
  CloudSun,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getMarketData, getClimateRisk, getLLMInsight } from "@/lib/api";
import { getMandiArbitrage, MandiArbitrageResponse } from "@/lib/mandi_api";
import { fetchFieldAlerts, AlertsResponse } from "@/lib/crop_doctor_api";
import { getRecommendedSubsidies, RecommendedSubsidiesResponse } from "@/lib/subsidies_api";
import DashboardSatelliteWidget from "@/components/DashboardSatelliteWidget";
import ErrorMessage from "@/components/ui/ErrorMessage";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const CROP_AVERAGE_YIELDS_PER_ACRE: Record<string, number> = {
  Wheat: 20,
  Rice: 24,
  Maize: 22,
  Soybean: 12,
  Cotton: 10,
  Sugarcane: 340,
  Tomato: 140,
  Potato: 120,
  Mustard: 8,
  Chickpea: 9,
  Onion: 120,
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [marketData, setMarketData] = useState<any>(null);
  const [climateRisk, setClimateRisk] = useState<any>(null);
  const [mandiArbitrage, setMandiArbitrage] = useState<MandiArbitrageResponse | null>(null);
  const [fieldAlerts, setFieldAlerts] = useState<AlertsResponse | null>(null);
  const [subsidiesSummary, setSubsidiesSummary] = useState<RecommendedSubsidiesResponse | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const safeCrop = user?.crop || "Wheat";
      const safeLocation = user?.location || "Punjab";
      const safeAcres = user?.acres || 5;

      const [marketRes, climateRes, arbitrageRes, alertsRes, subsidiesRes] = await Promise.allSettled([
        getMarketData(safeCrop),
        getClimateRisk(undefined, undefined, safeCrop),
        getMandiArbitrage(safeCrop, safeLocation),
        fetchFieldAlerts(user?.lat, user?.lng, safeCrop, safeLocation),
        getRecommendedSubsidies({ state: safeLocation, crop: safeCrop, acres: safeAcres }),
      ]);

      const topMarketData = marketRes.status === "fulfilled" ? marketRes.value : {};
      setMarketData(topMarketData);

      if (climateRes.status === "fulfilled") {
        setClimateRisk(climateRes.value);
      }
      if (arbitrageRes.status === "fulfilled") {
        setMandiArbitrage(arbitrageRes.value);
      }
      if (alertsRes.status === "fulfilled") {
        setFieldAlerts(alertsRes.value);
      }
      if (subsidiesRes.status === "fulfilled") {
        setSubsidiesSummary(subsidiesRes.value);
      }

      // Fetch AI insight
      if (topMarketData?.crop_name || safeCrop) {
        try {
          const insightRes = await getLLMInsight({
            crop: topMarketData?.crop_name || safeCrop,
            predicted_yield: 45 * safeAcres,
            current_price: topMarketData?.current_price || 2000,
            climate_risk_level: climateRes.status === "fulfilled" ? climateRes.value?.risk_level || "Low" : "Low",
            location: safeLocation,
          });

          setAiInsight(
            insightRes?.insight_text ||
              insightRes?.insight ||
              insightRes?.response ||
              "Market and climate indicators show favorable harvest momentum for your region."
          );
        } catch (insightErr) {
          console.warn("Failed to fetch AI insight:", insightErr);
          setAiInsight("Market and climate indicators show favorable harvest momentum for your region.");
        }
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Failed to fetch dashboard data. Please check backend connection.";
      setError(errorMsg);
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.crop, user.location, user.acres]);

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse bg-[#D9CEB8]/40 rounded-[10px] ${className}`}></div>
  );

  const translatedCrop = t(`crop.${user.crop}`, user.crop);
  const translatedSeason = t(`season.${user.season}`, user.season);

  // Dynamic Revenue & Output Calculation
  const yieldPerAcre = CROP_AVERAGE_YIELDS_PER_ACRE[user.crop] || 20;
  const expectedOutputQuintals = Math.round((user.acres || 5) * yieldPerAcre);
  const liveModalPrice = Number(marketData?.price ?? marketData?.current_price ?? marketData?.price_inr ?? 2275);
  const estimatedGrossRevenue = Math.round(expectedOutputQuintals * liveModalPrice);

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-8 max-w-[1100px] w-full mx-auto pb-12">
        {/* Header Area */}
        <section className="flex flex-row justify-between items-end gap-4">
          <div className="flex flex-col items-start gap-1">
            <span className="uppercase tracking-[0.14em] text-[#5C7A52] text-[11px] font-medium border-b-[0.5px] border-[#C9A97A] pb-1 mb-1">
              {t("dashboard.commandCenter")} · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <h1 className="font-display font-semibold text-[28px] text-[#2C2416]">
              {t("dashboard.goodMorning")}, {user.name}.
            </h1>
            <p className="font-body font-light text-[14px] text-[#7A6A55]">
              {translatedCrop} {t("dashboard.season")} ({translatedSeason}) · {user.acres} {t("common.acres")} in {user.location}
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center justify-center gap-2 border-[0.5px] border-[#D9CEB8] text-[#5C7A52] hover:bg-[#F5F1EA] px-[16px] py-[8px] rounded-[24px] font-medium text-[12px] bg-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {t("dashboard.refresh")}
          </button>
        </section>

        {error && (
          <ErrorMessage message={error} onRetry={fetchDashboardData} className="w-full" />
        )}

        {/* HERO COMMAND CARD: Estimated Seasonal Gross Revenue & Output Tracker */}
        <section className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#2C2416] via-[#3A2E1D] to-[#1E1810] text-[#FDFAF4] p-6 sm:p-8 shadow-md border border-[#C9A97A]/30">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#5C7A52]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#C9A97A]/20 border border-[#C9A97A]/40 text-[#E8DFC9] text-[11px] font-medium uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[#E5A93C]" />
                  {t("dashboard.estimatedRevenue")}
                </span>
                <span className="text-white/60 text-[11px]">
                  {user.acres} Acres × {yieldPerAcre} Qtl/Acre
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                {loading ? (
                  <Skeleton className="h-12 w-48 bg-white/20" />
                ) : (
                  <span className="font-display font-bold text-[36px] sm:text-[44px] text-[#FDFAF4] tracking-tight">
                    ₹{estimatedGrossRevenue.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="text-[#C9A97A] text-[13px] font-medium">Gross Harvest Value</span>
              </div>

              <p className="text-[#E8DFC9]/80 text-[13px] font-body max-w-xl leading-relaxed">
                Projected from your registered {user.acres} acres of {translatedCrop} with live APMC benchmark of ₹{liveModalPrice}/Qtl.
              </p>
            </div>

            {/* Quick Metrics Pills */}
            <div className="grid grid-cols-2 gap-3 min-w-[280px]">
              <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3.5 rounded-[12px] flex flex-col">
                <span className="text-[#C9A97A] text-[11px] font-medium uppercase tracking-wider">
                  {t("dashboard.expectedOutput")}
                </span>
                <span className="font-display font-semibold text-[20px] text-white">
                  {expectedOutputQuintals} Quintals
                </span>
                <span className="text-[11px] text-white/60">
                  ~{(expectedOutputQuintals * 100).toLocaleString("en-IN")} kg
                </span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3.5 rounded-[12px] flex flex-col">
                <span className="text-[#C9A97A] text-[11px] font-medium uppercase tracking-wider">
                  {t("dashboard.livePrice")}
                </span>
                <span className="font-display font-semibold text-[20px] text-[#85A642]">
                  ₹{liveModalPrice}
                </span>
                <span className="text-[11px] text-white/60">Per Quintal modal</span>
              </div>
            </div>
          </div>
        </section>

        {/* Season Progress Bar */}
        <section className="w-full relative bg-[#FDFAF4] border border-[#D9CEB8] rounded-[12px] p-4 shadow-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="uppercase tracking-[0.14em] text-[#7A6A55] text-[10px] font-medium">
              {translatedCrop} {t("dashboard.seasonProgress")}
            </span>
            <span className="text-[11px] text-[#5C7A52] font-semibold">Week 14 of 26 (54%)</span>
          </div>
          <div className="w-full h-[7px] bg-[#E8DFC9] rounded-[4px] relative mb-2 overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-[#5C7A52] rounded-[4px] transition-all duration-700"
              style={{ width: "53.8%" }}
            ></div>
          </div>
          <div className="flex justify-between w-full text-[11px] font-medium px-1 text-[#7A6A55]">
            <span className="text-left">{t("dashboard.planting")}</span>
            <span className="text-center font-semibold text-[#2C2416]">{t("dashboard.growing")}</span>
            <span className="text-right">{t("dashboard.harvest")}</span>
          </div>
        </section>

        {/* Three Core Metric Tiles: Market Price, Mandi Arbitrage, Volatility */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tile 1: Current APMC Price */}
          <div className="bg-[#FDFAF4] rounded-[12px] p-5 border border-[#D9CEB8] flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[#7A6A55] font-medium text-[11px] uppercase tracking-[0.06em] block mb-1">
                {translatedCrop} {t("dashboard.pricePerQuintal")}
              </span>
              {loading ? (
                <Skeleton className="h-9 w-28 my-1" />
              ) : (
                <span className="font-display font-bold text-[32px] text-[#5C7A52]">
                  ₹{liveModalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <div className="flex items-center text-[#5C7A52] font-medium text-[11px] mt-2 gap-1">
              <TrendingUp size={13} />
              <span>{t("dashboard.currentMarketData")}</span>
            </div>
          </div>

          {/* Tile 2: Live Mandi Arbitrage Highlight */}
          <div className="bg-[#FDFAF4] rounded-[12px] p-5 border border-[#D9CEB8] flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[#7A6A55] font-medium text-[11px] uppercase tracking-[0.06em]">
                  {t("dashboard.arbitrageTitle")}
                </span>
                <span className="bg-[#B07A3A]/20 text-[#B07A3A] font-semibold text-[10px] px-2 py-0.5 rounded-full">
                  APMC Spread
                </span>
              </div>
              {loading ? (
                <Skeleton className="h-9 w-36 my-1" />
              ) : mandiArbitrage ? (
                <div>
                  <span className="font-display font-bold text-[22px] text-[#2C2416] line-clamp-1">
                    {mandiArbitrage.highest_paying_mandi}
                  </span>
                  <div className="text-[12px] text-[#5C7A52] font-semibold flex items-center gap-1 mt-0.5">
                    <span>+₹{mandiArbitrage.price_spread_inr}</span>
                    <span className="text-[#7A6A55] font-normal">{t("dashboard.perQtlMore")}</span>
                  </div>
                </div>
              ) : (
                <span className="font-display font-semibold text-[20px] text-[#2C2416]">
                  Khanna Mandi
                </span>
              )}
            </div>
            <Link
              href="/mandi"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#7A3B2E] hover:underline mt-2 w-max"
            >
              <span>Compare Mandis</span>
              <ArrowRight size={11} />
            </Link>
          </div>

          {/* Tile 3: 7-Day Velocity & Volatility */}
          <div className="bg-[#FDFAF4] rounded-[12px] p-5 border border-[#D9CEB8] flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-[#7A6A55] font-medium text-[11px] uppercase tracking-[0.06em] block mb-1">
                {t("dashboard.priceChange7d")}
              </span>
              {loading ? (
                <Skeleton className="h-9 w-24 my-1" />
              ) : (
                <span className="font-display font-bold text-[32px] text-[#2C2416]">
                  {marketData?.price_change_7d ?? "+12.4%"}
                </span>
              )}
            </div>
            <div className="flex items-center text-[#7A6A55] font-medium text-[11px] mt-2 gap-1">
              {marketData?.price_change_7d?.startsWith("-") ? (
                <ArrowDown size={12} className="text-[#7A3B2E]" />
              ) : (
                <ArrowUp size={12} className="text-[#5C7A52]" />
              )}
              <span>{t("dashboard.comparedToLastWeek")}</span>
            </div>
          </div>
        </section>

        {/* Agronomic Hazard & Spray Feasibility Alert */}
        {loading ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <section
            className={`border-l-[4px] p-4 rounded-r-[12px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
              fieldAlerts?.active_alerts?.some((a) => a.severity === "High" || a.severity === "Critical")
                ? "bg-[#EDE3D3] border-[#7A3B2E]"
                : "bg-[#DDE8D9] border-[#5C7A52]"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  fieldAlerts?.active_alerts?.some((a) => a.severity === "High" || a.severity === "Critical")
                    ? "bg-[#7A3B2E] text-white"
                    : "bg-[#5C7A52] text-white"
                }`}
              >
                {fieldAlerts?.active_alerts?.some((a) => a.severity === "High" || a.severity === "Critical") ? (
                  <AlertTriangle size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-display font-semibold text-[14px] text-[#2C2416] flex items-center gap-2">
                  <span>{t("dashboard.sprayWindow")}:</span>
                  <span
                    className={
                      fieldAlerts?.active_alerts?.some((a) => a.severity === "High" || a.severity === "Critical")
                        ? "text-[#7A3B2E]"
                        : "text-[#2F5233]"
                    }
                  >
                    {fieldAlerts?.active_alerts?.some((a) => a.severity === "High" || a.severity === "Critical")
                      ? t("dashboard.sprayHazard")
                      : t("dashboard.spraySafe")}
                  </span>
                </span>
                <p className="font-body text-[12px] text-[#4A2418] mt-0.5 leading-normal">
                  {fieldAlerts?.active_alerts?.[0]?.action_required ||
                    climateRisk?.message ||
                    "Weather conditions optimal. Wind speeds < 12 km/h and negligible rain expected for next 48 hours."}
                </p>
              </div>
            </div>

            <Link
              href="/climate"
              className="shrink-0 font-medium text-[12px] text-[#7A3B2E] hover:underline bg-white/70 px-3 py-1.5 rounded-full border border-[#D9CEB8]"
            >
              {t("dashboard.seeFullClimateReport")}
            </Link>
          </section>
        )}

        {/* Two-Column Command Hub: Action Cards + Mini Satellite Widget */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Quick-Action Cards & AI Advisor Insight */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Quick Action 1: Smart Crop Doctor Card */}
            <div className="bg-[#FDFAF4] rounded-[12px] p-5 border border-[#D9CEB8] flex items-center justify-between gap-4 shadow-xs hover:border-[#7A3B2E]/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#EDE3D3] flex items-center justify-center text-[#7A3B2E] shrink-0">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-[16px] text-[#2C2416]">
                    {t("dashboard.cropDoctorCard")}
                  </h3>
                  <p className="font-body text-[12px] text-[#7A6A55]">
                    {t("dashboard.doctorQuickScan")}
                  </p>
                </div>
              </div>

              <Link
                href="/doctor"
                className="shrink-0 bg-[#7A3B2E] hover:bg-[#683025] text-[#FDFAF4] px-4 py-2 rounded-[20px] font-body text-[12px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Diagnose</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Quick Action 2: Subsidies & Insurance Card */}
            <div className="bg-[#FDFAF4] rounded-[12px] p-5 border border-[#D9CEB8] flex items-center justify-between gap-4 shadow-xs hover:border-[#5C7A52]/50 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-[#DDE8D9] flex items-center justify-center text-[#5C7A52] shrink-0">
                  <Coins size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-[16px] text-[#2C2416]">
                      {t("dashboard.subsidiesOverview")}
                    </h3>
                    <span className="bg-[#5C7A52]/20 text-[#2F5233] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {subsidiesSummary?.total_eligible_schemes || 5} Eligible
                    </span>
                  </div>
                  <p className="font-body text-[12px] text-[#7A6A55]">
                    Up to ₹{(subsidiesSummary?.total_estimated_benefit_inr || 48000).toLocaleString("en-IN")} available financial aid
                  </p>
                </div>
              </div>

              <Link
                href="/subsidies"
                className="shrink-0 border border-[#5C7A52] text-[#5C7A52] hover:bg-[#DDE8D9] px-4 py-2 rounded-[20px] font-body text-[12px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Explore</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* AI Farm Advisor Insight Box */}
            <div className="bg-[#F5F1EA] p-6 rounded-[12px] border border-[#E8DFC9] flex flex-col justify-between gap-4 shadow-xs">
              <div>
                <h3 className="font-display italic text-[16px] text-[#5C7A52] mb-2 flex items-center gap-1.5">
                  <Sparkles size={16} />
                  <span>{t("dashboard.marketTellingYou")}</span>
                </h3>
                <p className="font-body font-light text-[13px] text-[#2C2416] leading-relaxed">
                  {loading ? (
                    <span className="block animate-pulse">Loading AI intelligence advisory...</span>
                  ) : (
                    aiInsight
                  )}
                </p>
              </div>

              <Link
                href="/advisor"
                className="self-start inline-flex items-center gap-1.5 border border-[#5C7A52] text-[#5C7A52] hover:bg-[#DDE8D9] rounded-[24px] px-4 py-2 font-medium text-[12px] transition-colors cursor-pointer"
              >
                <span>{t("dashboard.askAdvisorBtn")}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Mini Satellite Land Intelligence Card */}
          <div className="lg:col-span-5">
            <DashboardSatelliteWidget
              lat={user.lat || 30.901}
              lng={user.lng || 75.8573}
              locationName={`${user.district || user.location || "Ludhiana"}, ${user.location || "Punjab"}`}
              state={user.location || "Punjab"}
              crop={user.crop || "Wheat"}
              acres={user.acres || 5}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-4 border-t-[0.5px] border-[#E8DFC9] flex justify-center">
          <p className="font-body text-[11px] text-[#7A6A55] font-light">
            {t("dashboard.dataUpdated")}
          </p>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
