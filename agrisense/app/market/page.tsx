"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { fetchMarketData, fetchPriceForecast, PriceForecastResponse } from "@/lib/market_api";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";

// Dynamically import MarketCharts to decouple heavy Recharts & D3 libraries from initial load
const MarketCharts = dynamic(() => import("@/components/market/MarketCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
      <div className="lg:col-span-2 h-[380px] bg-[#FDFAF4] border-[0.5px] border-[#D9CEB8] rounded-[16px] p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <div className="h-5 w-40 bg-[#D9CEB8]/50 rounded-md" />
          <div className="h-6 w-24 bg-[#D9CEB8]/40 rounded-full" />
        </div>
        <div className="h-[260px] w-full bg-[#F5F1EA] rounded-[10px]" />
      </div>
      <div className="h-[380px] bg-[#FDFAF4] border-[0.5px] border-[#D9CEB8] rounded-[16px] p-6 flex flex-col gap-4">
        <div className="h-5 w-32 bg-[#D9CEB8]/50 rounded-md" />
        <div className="flex-1 bg-[#F5F1EA] rounded-[10px]" />
      </div>
    </div>
  ),
});

export default function MarketIntelligence() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeCrop, setActiveCrop] = useState<string>(user?.crop || "Wheat");
  const [marketData, setMarketData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<PriceForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const crops = ["Wheat", "Rice", "Maize", "Tomato", "Potato", "Soybean", "Cotton", "Mustard", "Onion"];

  useEffect(() => {
    if (user?.crop && user.crop !== activeCrop) {
      setActiveCrop(user.crop);
    }
  }, [user?.crop]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mRes, fRes] = await Promise.all([
          fetchMarketData(activeCrop, user?.location || user?.state),
          fetchPriceForecast(activeCrop, user?.location || user?.state, 14),
        ]);

        if (!isMounted) return;

        if (mRes) {
          setMarketData(mRes);
        } else {
          setError(`Market data not available for ${activeCrop} right now.`);
        }

        if (fRes) {
          setForecastData(fRes);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error(err);
        setError(`Failed to load market data for ${activeCrop}.`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [activeCrop, user?.location, user?.state]);

  const basePrice = marketData?.current_price || 2275;
  const recent30Days = marketData?.recent_prices || [];
  const recent7Days = recent30Days.slice(-7);
  const translatedActiveCrop = t(`crop.${activeCrop}`, activeCrop);

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-8 max-w-[1100px] w-full mx-auto pb-16">
        
        {/* Header */}
        <section className="flex flex-col gap-2 border-b-[0.5px] border-[#D9CEB8] pb-6">
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-[0.14em] text-[#5C7A52] text-[10px] font-semibold border-b-[0.5px] border-[#C9A97A] pb-1 flex items-center gap-1.5">
              <Sparkles size={13} className="text-[#5C7A52]" />
              AgriSense Machine Learning Market Lab
            </span>
            <span className="text-[11px] font-medium text-[#7A6A55] bg-[#EAE3D2] px-3 py-1 rounded-full">
              ⚡ Sub-10ms Cached Feed Active
            </span>
          </div>
          <h1 className="font-display font-semibold text-[28px] text-[#2C2416]">
            {t("market.title")}
          </h1>
          <p className="font-body text-[#7A6A55] text-[14px]">
            {t("market.subtitle")} · 30-day historical trajectories and 14-day forward price forecasts
          </p>
        </section>

        {/* Commodity Filter Chips */}
        <section className="flex flex-wrap gap-2.5">
          {crops.map((crop) => (
            <button
              key={crop}
              onClick={() => setActiveCrop(crop)}
              className={`px-4 py-2 rounded-[24px] text-[13px] font-medium transition-all ${
                activeCrop === crop
                  ? "bg-[#2D4A22] text-white shadow-xs font-semibold"
                  : "bg-[#F5F1EA] text-[#7A6A55] border border-[#D9CEB8] hover:bg-[#E8DFC9]"
              }`}
            >
              {t(`crop.${crop}`, crop)}
            </button>
          ))}
        </section>

        {/* Error State */}
        {error && (
          <div className="bg-[#FDFAF4] border-l-[3px] border-[#7A3B2E] p-4 text-[#7A3B2E] text-[13px] flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ML Hold vs. Sell Recommendation Banner */}
        {forecastData && (
          <section className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-[16px] p-6 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9CEB8]/70 pb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    forecastData.trade_advisory.badge_color === "green"
                      ? "bg-[#DDE8D9] text-[#2D4A22] border border-[#A8C4A1]"
                      : forecastData.trade_advisory.badge_color === "red"
                      ? "bg-[#FCE8E6] text-[#C5221F] border border-[#F5C2C7]"
                      : "bg-[#FEF3D6] text-[#8F6B00] border border-[#F8E2A2]"
                  }`}
                >
                  {forecastData.trade_advisory.badge}
                </span>
                <span className="text-[12px] text-[#7A6A55] font-medium">
                  Forward ML Trade Recommendation ({activeCrop})
                </span>
              </div>

              <div className="flex items-center gap-4 text-[13px] font-semibold">
                <span className="flex items-center gap-1 text-[#2C2416]">
                  Current: ₹{Math.round(forecastData.current_price)}/Qtl
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    forecastData.forecast_7d.change_inr >= 0 ? "text-[#2D4A22]" : "text-[#7A3B2E]"
                  }`}
                >
                  {forecastData.forecast_7d.change_inr >= 0 ? (
                    <TrendingUp size={15} />
                  ) : (
                    <TrendingDown size={15} />
                  )}
                  7d: {forecastData.forecast_7d.change_inr >= 0 ? "+" : ""}
                  ₹{forecastData.forecast_7d.change_inr} ({forecastData.forecast_7d.change_pct}%)
                </span>
              </div>
            </div>

            <p className="font-body text-[13px] sm:text-[14px] text-[#2C2416] leading-relaxed bg-[#F5F1EA] p-4 rounded-[12px] border border-[#D9CEB8]/60">
              💡 <strong>Actionable Strategy:</strong> {forecastData.trade_advisory.recommendation}
            </p>

            {/* 14-Day Forward Trajectory Cards */}
            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold uppercase text-[#7A6A55] tracking-wider">
                14-Day Price Projection Corridor (90% Confidence Interval)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 overflow-x-auto pb-1">
                {forecastData.projections.slice(0, 7).map((p) => {
                  const isGain = p.projected_change_inr >= 0;
                  return (
                    <div
                      key={p.day_index}
                      className="bg-white border border-[#D9CEB8] rounded-[10px] p-2.5 text-center flex flex-col gap-1 shadow-xs"
                    >
                      <span className="text-[11px] font-semibold text-[#7A6A55] uppercase">
                        {p.day_name} ({p.full_date})
                      </span>
                      <span className="text-[15px] font-bold text-[#2C2416]">
                        ₹{Math.round(p.predicted_price)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isGain ? "text-[#2D4A22]" : "text-[#7A3B2E]"
                        }`}
                      >
                        {isGain ? "+" : ""}₹{p.projected_change_inr}
                      </span>
                      <span className="text-[9px] text-[#A69B8D] border-t border-[#D9CEB8]/50 pt-1 mt-0.5">
                        Range: ₹{Math.round(p.lower_bound_90pct)} - ₹{Math.round(p.upper_bound_90pct)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Historical 30-Day Trajectory Charts */}
        {!error && (
          <MarketCharts
            recent30Days={recent30Days}
            recent7Days={recent7Days}
            loading={loading}
            basePrice={basePrice}
            translatedActiveCrop={translatedActiveCrop}
            marketData={marketData}
            t={t}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
