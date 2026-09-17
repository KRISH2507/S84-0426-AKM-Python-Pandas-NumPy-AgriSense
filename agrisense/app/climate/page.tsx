"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  fetchClimateForecast,
  fetchFieldAlerts,
  DayForecast,
  FieldAlert,
} from "@/lib/crop_doctor_api";
import {
  CloudSun,
  Droplets,
  Wind,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  SunMedium,
  CloudRain,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function Climate() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [forecast, setForecast] = useState<DayForecast[]>([]);
  const [optimalDays, setOptimalDays] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<FieldAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const lat = user?.latitude ? Number(user.latitude) : 30.9010;
      const lon = user?.longitude ? Number(user.longitude) : 75.8573;
      const crop = user?.crop || "Wheat";
      const state = user?.state || "Punjab";

      const [forecastRes, alertsRes] = await Promise.all([
        fetchClimateForecast(lat, lon, crop),
        fetchFieldAlerts(lat, lon, crop, state),
      ]);

      if (forecastRes && forecastRes.daily) {
        setForecast(forecastRes.daily);
        setOptimalDays(forecastRes.optimal_spray_days || []);
      }
      if (alertsRes && alertsRes.alerts) {
        setAlerts(alertsRes.alerts);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load climate data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  return (
    <ProtectedRoute>
      <div className="flex flex-col gap-10 max-w-[1100px] w-full mx-auto pb-16">
        
        {/* Header */}
        <section className="flex flex-col items-start gap-1 w-full border-b border-[#D9CEB8] pb-4">
          <div className="flex items-center justify-between w-full">
            <span className="uppercase tracking-[0.14em] text-[#5C7A52] text-[10px] font-semibold border-b-[0.5px] border-[#C9A97A] pb-1 flex items-center gap-2">
              <CloudSun size={14} className="text-[#5C7A52]" />
              {t("climate.tag")}
            </span>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAE3D2] border border-[#D9CEB8] text-[11px] font-medium text-[#2C2416]">
                📍 {user?.state || "Punjab"} ({user?.crop || "Wheat"})
              </span>
              <button
                type="button"
                onClick={loadData}
                disabled={isLoading}
                className="p-1.5 rounded-full border border-[#D9CEB8] hover:bg-[#F5F1EA] text-[#7A6A55] transition-colors"
                title="Refresh Weather"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="flex w-full items-center justify-between mt-1">
            <h1 className="font-display font-semibold text-[26px] sm:text-[30px] text-[#2C2416]">
              {t("climate.title")}
            </h1>
            <span className="bg-[#F0E4CC] text-[#B07A3A] px-[12px] py-[4px] rounded-[20px] font-medium uppercase text-[11px] tracking-[0.08em] shadow-xs">
              {alerts.length > 0 ? `${alerts.length} Hazards Active` : t("common.low")}
            </span>
          </div>
          <p className="font-body text-[#7A6A55] text-[13px] sm:text-[14px]">
            {t("climate.subtitle")} · Hyperlocal 10-day field forecasts and spraying feasibility
          </p>
        </section>

        {/* Optimal Spray Window Advisor Banner */}
        <section className="bg-gradient-to-r from-[#2D4A22] to-[#3A5E32] rounded-[16px] p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider">
                Agronomic Spray Window
              </span>
              <span className="text-[12px] text-[#C9E2C4] font-medium">
                10-Day Optimization
              </span>
            </div>
            <h2 className="font-display font-semibold text-[20px] sm:text-[22px]">
              {optimalDays.length > 0
                ? `Optimal Spray Window: ${optimalDays.join(", ")}`
                : "Weather Caution: Delay Spraying Until Dry Window"}
            </h2>
            <p className="text-[13px] text-[#E0EEDC] max-w-[650px] leading-relaxed">
              Pesticide and foliar fertilizer sprays require wind speeds under 15 km/h and zero rain for 24-48 hours. Follow the green indicators below to avoid chemical wash-off and financial waste.
            </p>
          </div>

          <Link
            href="/doctor"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FDFAF4] text-[#2D4A22] font-semibold text-[13px] rounded-full hover:bg-white transition-all shadow-sm flex-shrink-0"
          >
            <Sparkles size={16} />
            Open Crop Doctor
          </Link>
        </section>

        {/* 10-Day Hyperlocal Forecast Scrollable Cards */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-[17px] text-[#2C2416] flex items-center gap-2">
              <Calendar size={17} className="text-[#5C7A52]" />
              {t("climate.forecast10d")}
            </h3>
            <span className="text-[11px] text-[#7A6A55]">
              Scroll to view full 10-day window →
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none w-full snap-x snap-mandatory">
            {forecast.map((d, i) => {
              const isHazard = d.spray_window.status === "Hazard";
              const isOptimal = d.spray_window.status === "Optimal";
              return (
                <div
                  key={i}
                  className={`min-w-[135px] flex-1 bg-[#FDFAF4] border rounded-[14px] p-4 flex flex-col items-center gap-2.5 text-center snap-center shadow-xs transition-all ${
                    i === 0
                      ? "border-[#7A3B2E] ring-1 ring-[#7A3B2E]/30 bg-[#FFFDF9]"
                      : "border-[#D9CEB8]"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-body text-[12px] uppercase text-[#7A6A55] tracking-wider font-semibold">
                      {d.day_name}
                    </span>
                    <span className="text-[10px] text-[#A69B8D]">{d.full_date}</span>
                  </div>

                  <div className="my-1">
                    {d.precipitation_mm > 5 ? (
                      <CloudRain size={26} className="text-[#4A7C9D]" />
                    ) : d.temp_max > 32 ? (
                      <SunMedium size={26} className="text-[#C98A2C]" />
                    ) : (
                      <CloudSun size={26} className="text-[#5C7A52]" />
                    )}
                  </div>

                  <span className="font-body text-[14px] text-[#2C2416] font-bold">
                    {d.temp_range}
                  </span>

                  <div className="flex flex-col items-center gap-1 text-[11px] text-[#7A6A55]">
                    <span className="flex items-center gap-1">
                      <Droplets size={11} className="text-[#4A7C9D]" />
                      {d.precipitation_mm}mm ({d.rain_probability}%)
                    </span>
                    <span className="flex items-center gap-1">
                      <Wind size={11} className="text-[#7A6A55]" />
                      {d.wind_speed_kmh} km/h
                    </span>
                  </div>

                  {/* Spray Window Status Badge */}
                  <span
                    className={`mt-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                      isOptimal
                        ? "bg-[#DDE8D9] text-[#2D4A22] border border-[#A8C4A1]"
                        : isHazard
                        ? "bg-[#FCE8E6] text-[#C5221F] border border-[#F5C2C7]"
                        : "bg-[#FEF3D6] text-[#8F6B00] border border-[#F8E2A2]"
                    }`}
                  >
                    {d.spray_window.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Active Field Hazard Alerts */}
        {alerts.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="font-display font-semibold text-[17px] text-[#2C2416] flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#7A3B2E]" />
              Active Field Hazard Warnings & Mitigations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-5 rounded-[14px] border flex flex-col gap-3 ${
                    alert.urgency === "CRITICAL"
                      ? "bg-[#FDFAF4] border-[#7A3B2E]/60 shadow-xs"
                      : "bg-[#F5F1EA] border-[#D9CEB8]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        alert.urgency === "CRITICAL"
                          ? "bg-[#7A3B2E] text-white"
                          : "bg-[#C9A97A] text-[#2C2416]"
                      }`}
                    >
                      {alert.urgency} · {alert.category}
                    </span>
                    <span className="text-[12px] text-[#7A6A55] font-medium">Field Warning</span>
                  </div>

                  <div>
                    <h4 className="font-display font-semibold text-[16px] text-[#2C2416]">
                      {alert.title}
                    </h4>
                    <p className="text-[13px] text-[#7A6A55] leading-relaxed mt-1">
                      {alert.description}
                    </p>
                  </div>

                  <div className="bg-white/80 p-3 rounded-[10px] border border-[#D9CEB8]/70 text-[12px] text-[#2C2416] flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-[#5C7A52] flex-shrink-0 mt-0.5" />
                    <span><strong>Recommended Action:</strong> {alert.action}</span>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Link
                      href={alert.action_link}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#5C7A52] hover:text-[#2D4A22] transition-colors"
                    >
                      Take Action <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Irrigation Recommendation */}
        <section className="bg-[#DDE8D9] border-l-[4px] border-[#5C7A52] p-5 rounded-r-[12px] shadow-xs">
          <h3 className="font-display font-semibold text-[15px] text-[#2D4A22] mb-1 flex items-center gap-2">
            <Droplets size={16} className="text-[#5C7A52]" />
            {t("climate.irrigationRec")}
          </h3>
          <p className="font-body text-[14px] text-[#2C2416] leading-relaxed">
            {t("climate.irrigationText")}
          </p>
        </section>

        {/* AI Field Impact Block */}
        <section className="bg-[#F5F1EA] p-6 rounded-[14px] border border-[#D9CEB8]/70 flex flex-col gap-3">
          <h2 className="font-display italic text-[17px] text-[#5C7A52]">
            {t("climate.cropImpactTitle")}
          </h2>
          <div className="font-body text-[13px] text-[#2C2416] leading-relaxed flex flex-col gap-3">
            <p>{t("climate.cropImpactText1")}</p>
            <p>{t("climate.cropImpactText2")}</p>
          </div>
        </section>

        {/* Historical Context Footer */}
        <section className="border-t border-[#E8DFC9] pt-6 flex justify-center text-center">
          <p className="font-body italic text-[12px] text-[#7A6A55] max-w-[650px]">
            {t("climate.historicalContext")}
          </p>
        </section>
      </div>
    </ProtectedRoute>
  );
}
