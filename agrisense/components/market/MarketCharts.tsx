"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MarketChartsProps {
  recent30Days: any[];
  recent7Days: any[];
  loading: boolean;
  basePrice: number;
  translatedActiveCrop: string;
  marketData: any;
  t: (key: string, fallback?: string) => string;
}

export default function MarketCharts({
  recent30Days,
  recent7Days,
  loading,
  basePrice,
  translatedActiveCrop,
  marketData,
  t,
}: MarketChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main 30-Day Chart */}
      <div className="lg:col-span-2 bg-white border-[0.5px] border-[#D9CEB8] rounded-[16px] p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-semibold text-[16px] text-[#2C2416]">
            {t("market.trend30d")} ({translatedActiveCrop})
          </h2>
          <span className="text-[#5C7A52] font-medium text-[13px] bg-[#DDE8D9] px-3 py-1 rounded-[16px]">
            ₹{basePrice} {t("market.perQtl")}
          </span>
        </div>

        <div className="h-[300px] w-full">
          {loading ? (
            <div className="w-full h-full animate-pulse bg-[#F5F1EA] rounded-[8px]" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={recent30Days}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5C7A52" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5C7A52" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E8DFC9"
                />
                <XAxis dataKey="date" hide />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fill: "#7A6A55", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#2C2416",
                    color: "#fff",
                    borderRadius: "8px",
                    border: "none",
                  }}
                  itemStyle={{ color: "#DDE8D9" }}
                  labelStyle={{
                    color: "#A89E89",
                    fontSize: "11px",
                    marginBottom: "4px",
                    display: "block",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#5C7A52"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Mini Cards */}
      <div className="flex flex-col gap-6">
        {/* 7-Day Velocity */}
        <div className="bg-[#F5F1EA] rounded-[16px] p-6 flex flex-col justify-between h-full">
          <div className="flex flex-col gap-1">
            <span className="text-[#7A6A55] font-medium text-[11px] uppercase tracking-[0.06em]">
              {t("market.velocity7d")}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-semibold text-[24px] text-[#2C2416]">
                {marketData?.price_change_7d || "+4.2%"}
              </span>
              {(marketData?.price_change_7d || "+").includes("+") ? (
                <TrendingUp size={16} className="text-[#5C7A52]" />
              ) : (
                <TrendingDown size={16} className="text-[#7A3B2E]" />
              )}
            </div>
          </div>
          <div className="h-[80px] w-full mt-4">
            {loading ? (
              <div className="w-full h-full animate-pulse bg-[#D9CEB8]/40 rounded-[4px]" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recent7Days}>
                  <Bar dataKey="price" fill="#C9A97A" radius={[4, 4, 0, 0]} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "#2C2416",
                      color: "#fff",
                      borderRadius: "4px",
                      border: "none",
                      padding: "4px 8px",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#DDE8D9" }}
                    labelStyle={{ display: "none" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Volatility Indicator */}
        <div className="bg-[#2C2416] rounded-[16px] p-6 flex flex-col gap-4 text-white">
          <div className="flex items-center gap-2 text-[#E8DFC9]">
            <Activity size={16} />
            <span className="font-medium text-[11px] uppercase tracking-[0.06em]">
              {t("market.volatilityScore")}
            </span>
          </div>
          <div>
            <span className="font-display font-semibold text-[32px] block mb-1">
              {marketData?.volatility
                ? t(`common.${marketData.volatility.toLowerCase()}`, marketData.volatility)
                : t("common.moderate")}
            </span>
            <div className="w-full h-[6px] bg-[#4A4234] rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full ${
                  (marketData?.volatility || "Moderate") === "High"
                    ? "bg-[#7A3B2E]"
                    : (marketData?.volatility || "Moderate") === "Moderate"
                    ? "bg-[#C9A97A]"
                    : "bg-[#5C7A52]"
                }`}
                style={{
                  width:
                    (marketData?.volatility || "Moderate") === "High"
                      ? "85%"
                      : (marketData?.volatility || "Moderate") === "Moderate"
                      ? "50%"
                      : "25%",
                }}
              />
            </div>
            <p className="text-[12px] text-[#A69B8D] mt-3 leading-relaxed">
              {t("market.volatilityDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
