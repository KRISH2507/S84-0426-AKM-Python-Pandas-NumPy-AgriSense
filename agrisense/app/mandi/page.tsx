"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useLanguage } from "@/context/LanguageContext";
import {
  getMandiRates,
  getMandiArbitrage,
  syncMandiRates,
  MandiRecordItem,
  MandiArbitrageResponse,
} from "@/lib/mandi_api";
import {
  Store,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ArrowRight,
  Truck,
  Sparkles,
  MapPin,
  Scale,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

function Sparkline({ values, trend }: { values: number[]; trend: string }) {
  if (!values || values.length < 2) return <span className="text-xs text-[#7A6A55]">—</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 70;
  const h = 24;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible inline-block">
      <polyline
        points={pts}
        fill="none"
        stroke={trend === "up" ? "#2D4A22" : "#7A3B2E"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MandiPage() {
  const { t } = useLanguage();

  // Filter & Search states
  const [selectedState, setSelectedState] = useState<string>("All");
  const [selectedCommodity, setSelectedCommodity] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("modal_price_desc");

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [records, setRecords] = useState<MandiRecordItem[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCommodities, setAvailableCommodities] = useState<string[]>([]);
  const [lastSync, setLastSync] = useState<string>("");

  // Arbitrage state
  const [arbitrage, setArbitrage] = useState<MandiArbitrageResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load Mandi Data
  const loadMandiData = async () => {
    setLoading(true);
    try {
      const res = await getMandiRates({
        state: selectedState,
        commodity: selectedCommodity,
        search: searchQuery,
        sort_by: sortBy,
      });
      setRecords(res.records);
      setAvailableStates(["All", ...res.active_states]);
      setAvailableCommodities(["All", ...res.commodities]);
      setLastSync(res.last_sync_timestamp);
    } catch (e) {
      toast.error("Could not fetch APMC Mandi rates. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // Load Arbitrage
  const loadArbitrage = async () => {
    const targetCrop = selectedCommodity !== "All" ? selectedCommodity : "Wheat";
    const targetState = selectedState !== "All" ? selectedState : "Punjab";
    try {
      const arb = await getMandiArbitrage(targetCrop, targetState);
      setArbitrage(arb);
    } catch (e) {
      setArbitrage(null);
    }
  };

  useEffect(() => {
    loadMandiData();
    loadArbitrage();
  }, [selectedState, selectedCommodity, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMandiData();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncMandiRates();
      toast.success(res.message || "Mandi rates synchronized!");
      loadMandiData();
      loadArbitrage();
    } catch (e) {
      toast.error("Failed to sync with Agmarknet feed.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 font-body text-[#2C2416]">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D9CEB8] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF0E6] text-[#2D4A22] text-xs font-semibold mb-2">
              <Store className="w-3.5 h-3.5" />
              Live Agmarknet APMC Wholesale Feed Active
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#2C2416]">
              APMC Mandi Intelligence Explorer
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6A55] mt-1">
              Real-time wholesale modal rates, daily arrival volumes (Tonnes), and inter-mandi price arbitrage opportunities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7A3B2E] hover:bg-[#683025] text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Live Rates"}
            </button>
          </div>
        </div>

        {/* ── ARBITRAGE RECOMMENDATION CARD ── */}
        {arbitrage && arbitrage.price_spread_inr > 0 && (
          <div className="bg-[#FDFAF4] border-2 border-[#5C7A52]/50 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2D4A22]">
                  <Truck className="w-4 h-4 text-[#2D4A22]" />
                  Mandi Arbitrage Opportunity Detected ({arbitrage.commodity} • {arbitrage.state})
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#2C2416]">
                  {arbitrage.recommendation}
                </h3>
              </div>

              <div className="flex items-center gap-4 shrink-0 bg-[#EBF0E6] p-3.5 rounded-xl border border-[#2D4A22]/30">
                <div>
                  <span className="text-[11px] text-[#2D4A22] block font-medium">Profit Spread</span>
                  <span className="font-display font-bold text-xl text-[#2D4A22]">
                    +₹{arbitrage.price_spread_inr.toLocaleString("en-IN")}/Qtl
                  </span>
                </div>
                <div className="h-8 w-[1px] bg-[#2D4A22]/30" />
                <div>
                  <span className="text-[11px] text-[#2D4A22] block font-medium">Extra Margin</span>
                  <span className="font-display font-bold text-xl text-[#2D4A22]">
                    +{arbitrage.spread_percentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FILTER & SEARCH CONTROLS ── */}
        <div className="bg-[#FDFAF4] p-5 rounded-xl border border-[#D9CEB8] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#7A6A55] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search market name, district, or crop..."
                className="w-full bg-[#F5F1EA] border border-[#D9CEB8] rounded-lg pl-9 pr-3.5 py-2 text-xs text-[#2C2416] focus:outline-none focus:border-[#7A3B2E]"
              />
            </form>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#7A6A55]" />
              <span className="text-[#7A6A55]">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#F5F1EA] border border-[#D9CEB8] rounded-lg px-2.5 py-1.5 text-xs text-[#2C2416] focus:outline-none cursor-pointer"
              >
                <option value="modal_price_desc">Highest Modal Price (₹)</option>
                <option value="modal_price_asc">Lowest Modal Price (₹)</option>
                <option value="arrivals_desc">Highest Arrivals (Tonnes)</option>
                <option value="change_desc">Top Daily Gainers (%)</option>
              </select>
            </div>
          </div>

          {/* State Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[#7A6A55] font-semibold pr-1 shrink-0">State:</span>
            {availableStates.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                className={`px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedState === st
                    ? "bg-[#2D4A22] text-white border-[#2D4A22] font-medium"
                    : "bg-[#F5F1EA] text-[#7A6A55] border-[#D9CEB8] hover:border-[#2C2416]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Commodity Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[#7A6A55] font-semibold pr-1 shrink-0">Crop:</span>
            {availableCommodities.map((comm) => (
              <button
                key={comm}
                onClick={() => setSelectedCommodity(comm)}
                className={`px-3 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                  selectedCommodity === comm
                    ? "bg-[#7A3B2E] text-white border-[#7A3B2E] font-medium"
                    : "bg-[#F5F1EA] text-[#7A6A55] border-[#D9CEB8] hover:border-[#2C2416]"
                }`}
              >
                {comm}
              </button>
            ))}
          </div>
        </div>

        {/* ── APMC MANDI TABLE ── */}
        <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-[#F5F1EA] animate-pulse rounded-lg" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-[#7A6A55]">
              <Scale className="w-12 h-12 text-[#D9CEB8] mx-auto mb-3" />
              <h3 className="font-display font-semibold text-lg text-[#2C2416]">No Mandi Records Found</h3>
              <p className="text-xs text-[#7A6A55] mt-1">Try resetting state or crop filters to view more markets.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F5F1EA] border-b border-[#D9CEB8] text-[#7A6A55] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 sm:px-6">Market / APMC</th>
                    <th className="py-3 px-4">Commodity</th>
                    <th className="py-3 px-4 text-right">Modal Rate</th>
                    <th className="py-3 px-4 text-center">Min – Max Range</th>
                    <th className="py-3 px-4 text-right">Daily Arrivals</th>
                    <th className="py-3 px-4 text-center">7-Day Trend</th>
                    <th className="py-3 px-4 sm:px-6 text-right">24h Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9CEB8]/60">
                  {records.map((r, idx) => (
                    <tr key={idx} className="hover:bg-[#F5F1EA]/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-sm text-[#2C2416]">{r.market}</div>
                        <div className="text-[11px] text-[#7A6A55] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#7A3B2E]" />
                          {r.district}, {r.state}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[#2C2416]">
                        <span className="px-2.5 py-1 rounded-md bg-[#F5F1EA] border border-[#D9CEB8]">
                          {r.commodity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-display font-bold text-base text-[#2C2416]">
                          ₹{r.modal_price.toLocaleString("en-IN")}
                        </div>
                        <span className="text-[10px] text-[#7A6A55]">per Quintal</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="text-xs font-medium text-[#7A6A55]">
                          ₹{r.min_price} – ₹{r.max_price}
                        </div>
                        <div className="w-28 mx-auto h-1.5 bg-[#D9CEB8] rounded-full overflow-hidden mt-1.5 flex">
                          <div className="bg-[#2D4A22] h-full w-full rounded-full" />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-[#2C2416]">
                        <div>{r.arrivals_tonnes} MT</div>
                        <span className="text-[10px] text-[#7A6A55]">Total Volume</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Sparkline values={r.price_history_7d} trend={r.trend} />
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            r.change_pct >= 0
                              ? "bg-[#EBF0E6] text-[#2D4A22]"
                              : "bg-[#FCEEEB] text-[#7A3B2E]"
                          }`}
                        >
                          {r.change_pct >= 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          {r.change_pct >= 0 ? `+${r.change_pct}%` : `${r.change_pct}%`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer bar */}
          <div className="bg-[#F5F1EA] px-6 py-3 border-t border-[#D9CEB8] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#7A6A55] gap-2">
            <span>Showing {records.length} registered APMC markets across India.</span>
            <span>Last Sync: {lastSync ? new Date(lastSync).toLocaleString("en-IN") : "Just now"}</span>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
