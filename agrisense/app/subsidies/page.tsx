"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  getRecommendedSubsidies,
  getInsuranceQuote,
  ingestNewScheme,
  SubsidySchemeItem,
  InsuranceQuoteResponse,
} from "@/lib/subsidies_api";
import { trackSubsidyApplication } from "@/lib/farmer_api";
import {
  ShieldCheck,
  Award,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Landmark,
  RefreshCw,
  PlusCircle,
  Clock,
  PhoneCall,
  Check,
  BookmarkPlus,
} from "lucide-react";
import { toast } from "sonner";

export default function SubsidiesAndInsurancePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<"subsidies" | "insurance" | "ingest">("subsidies");

  // Farm Parameters (Defaulted from logged-in farmer profile)
  const [state, setState] = useState<string>(user?.location || "Punjab");
  const [crop, setCrop] = useState<string>(user?.crop || "Wheat");
  const [acres, setAcres] = useState<number>(user?.acres ? Number(user.acres) : 3.0);
  const [season, setSeason] = useState<string>(user?.season || "Rabi");

  // Subsidies Data
  const [loadingSubsidies, setLoadingSubsidies] = useState<boolean>(true);
  const [subsidiesData, setSubsidiesData] = useState<{
    farmerCategory: string;
    totalEligible: number;
    totalBenefit: number;
    schemes: SubsidySchemeItem[];
    notificationBadge?: string | null;
  } | null>(null);

  // Selected Category Filter for Subsidies
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Checklist state for documents (schemeId -> { docName: checked })
  const [checkedDocs, setCheckedDocs] = useState<Record<string, Record<string, boolean>>>({});

  // Insurance Data
  const [loadingInsurance, setLoadingInsurance] = useState<boolean>(true);
  const [insuranceQuote, setInsuranceQuote] = useState<InsuranceQuoteResponse | null>(null);

  // Ingestion Simulator State
  const [announcementText, setAnnouncementText] = useState<string>("");
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  // Fetch Recommended Subsidies
  const fetchSubsidies = async () => {
    setLoadingSubsidies(true);
    try {
      const res = await getRecommendedSubsidies({
        state,
        crop,
        acres,
        season,
      });
      setSubsidiesData({
        farmerCategory: res.farmer_category,
        totalEligible: res.total_eligible_schemes,
        totalBenefit: res.total_estimated_benefit_inr,
        schemes: res.schemes,
        notificationBadge: res.notification_badge,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Could not fetch government subsidies. Ensure backend is running.");
    } finally {
      setLoadingSubsidies(false);
    }
  };

  // Fetch Live Insurance Quote
  const fetchInsurance = async () => {
    setLoadingInsurance(true);
    try {
      const res = await getInsuranceQuote({
        crop,
        state,
        acres,
        season,
      });
      setInsuranceQuote(res);
    } catch (err: any) {
      console.error(err);
      toast.error("Could not fetch insurance quote.");
    } finally {
      setLoadingInsurance(false);
    }
  };

  useEffect(() => {
    fetchSubsidies();
    fetchInsurance();
  }, [state, crop, acres, season]);

  // Handle Document Check Toggle
  const toggleDoc = (schemeId: string, docName: string) => {
    setCheckedDocs((prev) => {
      const currentSchemeDocs = prev[schemeId] || {};
      return {
        ...prev,
        [schemeId]: {
          ...currentSchemeDocs,
          [docName]: !currentSchemeDocs[docName],
        },
      };
    });
  };

  // Handle Ingestion Submission
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) {
      toast.error("Please enter government announcement text.");
      return;
    }

    setIsIngesting(true);
    try {
      const res = await ingestNewScheme({
        text_announcement: announcementText,
        source_url: sourceUrl || undefined,
      });

      if (res.success) {
        toast.success(`Success! Scheme '${res.scheme?.title || "New Scheme"}' ingested into AgriSense database!`);
        setAnnouncementText("");
        setSourceUrl("");
        setActiveTab("subsidies");
        fetchSubsidies();
      } else {
        toast.error(res.message || "Failed to parse announcement.");
      }
    } catch (err: any) {
      toast.error("Error communicating with ingestion engine.");
    } finally {
      setIsIngesting(false);
    }
  };

  // Preset Announcement for Quick Demo
  const handleTrackScheme = async (scheme: SubsidySchemeItem) => {
    try {
      await trackSubsidyApplication(1, {
        scheme_id: scheme.id,
        scheme_title: scheme.title,
        status: "APPLIED",
        applied_date: new Date().toISOString().split("T")[0],
        notes: `Tracked via Subsidies Hub for ${crop} in ${state}.`
      });
      toast.success(`'${scheme.title}' saved to your Farm Profile application tracker!`);
    } catch (e) {
      toast.error("Could not track scheme in database.");
    }
  };

  const loadPresetAnnouncement = () => {
    setAnnouncementText(`GOVERNMENT NOTIFICATION - DEPARTMENT OF AGRICULTURE
Special Solar Dryer & Cold Storage Subsidy 2026:
The Government hereby announces a 60% capital subsidy on decentralized farm-gate solar dryers and mini cold storage units (up to 5 MT capacity) for horticultural and grain farmers.
Applicable States: All States across India.
Target Crops: All crops including Tomato, Potato, Onion, Wheat, Maize, and Mustard.
Eligibility: Small and Marginal farmers (< 5 acres) receive 60% subsidy; large farmers receive 45%.
Financial Benefit: Maximum subsidy up to Rs 75,000 per unit.
Deadline to apply: November 15, 2026.
Required Documents: Aadhaar, Land Record (Khatauni/Khasra), Bank Account with e-KYC.
Apply online at: https://agricoop.nic.in/solar-cold-chain`);
    setSourceUrl("https://agricoop.nic.in/solar-cold-chain");
    toast.info("Loaded sample government circular!");
  };

  // Subsidies Category Filter Logic
  const categories = ["All", ...Array.from(new Set(subsidiesData?.schemes.map((s) => s.category) || []))];
  const filteredSchemes = subsidiesData?.schemes.filter(
    (s) => categoryFilter === "All" || s.category === categoryFilter
  ) || [];

  return (
    <div className="min-h-screen bg-[#F5F1EA] text-[#2C2416] pb-16 font-body">
      {/* Top Header Banner */}
      <div className="bg-[#FDFAF4] border-b border-[#D9CEB8] pt-8 pb-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF0E6] text-[#2D4A22] text-xs font-semibold mb-2">
                <ShieldCheck className="w-4 h-4 text-[#2D4A22]" />
                Direct Benefit Transfer (DBT) & PMFBY Crop Protection
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2416]">
                Subsidies & Crop Insurance Hub
              </h1>
              <p className="text-sm text-[#7A6A55] mt-1">
                Personalized government schemes, dynamic PMFBY insurance quotes calculated with live Mandi rates, and living policy updates.
              </p>
            </div>

            {/* Farm Profile Quick-Select Pill */}
            <div className="bg-[#F5F1EA] border border-[#D9CEB8] rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
              <div>
                <span className="text-[#7A6A55] block">Location</span>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="font-medium bg-transparent text-[#2C2416] focus:outline-none cursor-pointer"
                >
                  {["Punjab", "Haryana", "Uttar Pradesh", "Maharashtra", "Rajasthan", "Madhya Pradesh", "Bihar", "Gujarat"].map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="h-6 w-[1px] bg-[#D9CEB8]" />

              <div>
                <span className="text-[#7A6A55] block">Primary Crop</span>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="font-medium bg-transparent text-[#2C2416] focus:outline-none cursor-pointer"
                >
                  {["Wheat", "Rice", "Maize", "Cotton", "Mustard", "Sugarcane", "Tomato", "Potato", "Onion"].map((cr) => (
                    <option key={cr} value={cr}>{cr}</option>
                  ))}
                </select>
              </div>

              <div className="h-6 w-[1px] bg-[#D9CEB8]" />

              <div>
                <span className="text-[#7A6A55] block">Farm Size</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={acres}
                    onChange={(e) => setAcres(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                    className="w-14 font-medium bg-transparent text-[#2C2416] focus:outline-none border-b border-[#7A6A55]"
                  />
                  <span>Acres</span>
                </div>
              </div>

              <div className="h-6 w-[1px] bg-[#D9CEB8]" />

              <div>
                <span className="text-[#7A6A55] block">Category</span>
                <span className="font-bold text-[#7A3B2E] bg-[#FCEEEB] px-2 py-0.5 rounded-md">
                  {subsidiesData?.farmerCategory || "Marginal"}
                </span>
              </div>
            </div>
          </div>

          {/* Urgent Notification Banner */}
          {subsidiesData?.notificationBadge && (
            <div className="mt-4 bg-[#FCEEEB] border-l-4 border-[#7A3B2E] text-[#7A3B2E] px-4 py-2.5 rounded-r-lg flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 animate-pulse" />
                <span className="font-medium">{subsidiesData.notificationBadge}</span>
              </div>
              <span className="text-xs font-semibold underline cursor-pointer" onClick={() => setActiveTab("subsidies")}>
                View Details
              </span>
            </div>
          )}

          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-3 mt-6 border-b border-[#D9CEB8]">
            <button
              onClick={() => setActiveTab("subsidies")}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-all relative ${
                activeTab === "subsidies"
                  ? "text-[#7A3B2E] border-b-2 border-[#7A3B2E]"
                  : "text-[#7A6A55] hover:text-[#2C2416]"
              }`}
            >
              <Award className="w-4 h-4" />
              Eligible Subsidies ({subsidiesData?.totalEligible || 0})
            </button>

            <button
              onClick={() => setActiveTab("insurance")}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-all relative ${
                activeTab === "insurance"
                  ? "text-[#7A3B2E] border-b-2 border-[#7A3B2E]"
                  : "text-[#7A6A55] hover:text-[#2C2416]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Live PMFBY Insurance Calculator
            </button>

            <button
              onClick={() => setActiveTab("ingest")}
              className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 transition-all relative ${
                activeTab === "ingest"
                  ? "text-[#7A3B2E] border-b-2 border-[#7A3B2E]"
                  : "text-[#7A6A55] hover:text-[#2C2416]"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#C89D3C]" />
              Simulate Live Ingestion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* TAB 1: SUBSIDIES */}
        {activeTab === "subsidies" && (
          <div>
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-xl p-5 shadow-xs">
                <span className="text-xs font-semibold text-[#7A6A55] uppercase tracking-wider">
                  Total Eligible Benefits
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-[#2D4A22] mt-1">
                  ₹{subsidiesData?.totalBenefit ? subsidiesData.totalBenefit.toLocaleString("en-IN") : "0"}
                </div>
                <p className="text-xs text-[#7A6A55] mt-1">
                  Annual assistance value available for your {acres} acre {crop} farm.
                </p>
              </div>

              <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-xl p-5 shadow-xs">
                <span className="text-xs font-semibold text-[#7A6A55] uppercase tracking-wider">
                  Farmer Classification
                </span>
                <div className="text-xl sm:text-2xl font-bold font-display text-[#7A3B2E] mt-1">
                  {subsidiesData?.farmerCategory || "Marginal"}
                </div>
                <p className="text-xs text-[#7A6A55] mt-1">
                  Qualified for preferential 55% micro-irrigation and priority machine grants.
                </p>
              </div>

              <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-xl p-5 shadow-xs">
                <span className="text-xs font-semibold text-[#7A6A55] uppercase tracking-wider">
                  Active Verified Schemes
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-display text-[#2C2416] mt-1">
                  {subsidiesData?.totalEligible || 0}
                </div>
                <p className="text-xs text-[#7A6A55] mt-1">
                  {state} state government & Central DBT portals monitored.
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
              <span className="text-xs text-[#7A6A55] font-semibold pr-2">Filter:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all shrink-0 ${
                    categoryFilter === cat
                      ? "bg-[#2D4A22] text-white border-[#2D4A22]"
                      : "bg-[#FDFAF4] text-[#7A6A55] border-[#D9CEB8] hover:border-[#2C2416]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Subsidies List */}
            {loadingSubsidies ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-44 bg-[#FDFAF4] animate-pulse border border-[#D9CEB8] rounded-xl" />
                ))}
              </div>
            ) : filteredSchemes.length === 0 ? (
              <div className="text-center py-16 bg-[#FDFAF4] border border-[#D9CEB8] rounded-xl">
                <Landmark className="w-12 h-12 text-[#D9CEB8] mx-auto mb-3" />
                <h3 className="font-display font-semibold text-lg">No Schemes Match Filter</h3>
                <p className="text-sm text-[#7A6A55] mt-1">Try switching categories or expanding your crop selection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {filteredSchemes.map((scheme) => {
                  const schemeDocs = checkedDocs[scheme.id] || {};
                  const totalDocs = scheme.required_documents.length;
                  const readyDocs = Object.values(schemeDocs).filter(Boolean).length;
                  const isReadyToApply = totalDocs > 0 && readyDocs === totalDocs;

                  return (
                    <div
                      key={scheme.id}
                      className="bg-[#FDFAF4] border border-[#D9CEB8] hover:border-[#7A3B2E] transition-all rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#EBF0E6] text-[#2D4A22]">
                              {scheme.category}
                            </span>
                            <span className="text-xs font-medium text-[#7A6A55]">
                              {scheme.provider}
                            </span>
                          </div>

                          {scheme.days_left !== undefined && scheme.days_left <= 45 && (
                            <span className="text-xs font-bold text-[#7A3B2E] bg-[#FCEEEB] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {scheme.days_left} days left
                            </span>
                          )}
                        </div>

                        <h3 className="font-display text-lg sm:text-xl font-bold text-[#2C2416] mb-2">
                          {scheme.title}
                        </h3>

                        <p className="text-sm text-[#7A6A55] mb-4">
                          {scheme.description}
                        </p>

                        {/* Benefit & Rate Banner */}
                        <div className="bg-[#F5F1EA] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-4 mb-4">
                          <div>
                            <span className="text-xs text-[#7A6A55] block">Financial Benefit</span>
                            <span className="font-semibold text-sm text-[#2C2416]">{scheme.benefit_summary}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[#7A6A55] block">Subsidy Rate</span>
                            <span className="font-bold text-sm text-[#2D4A22]">{scheme.subsidy_rate}</span>
                          </div>
                          <div>
                            <span className="text-xs text-[#7A6A55] block">Est. Value</span>
                            <span className="font-display font-bold text-base text-[#7A3B2E]">
                              ₹{scheme.estimated_annual_benefit_inr.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Document Checklist */}
                        <div className="mt-4 pt-4 border-t border-[#D9CEB8]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-[#2C2416] flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-[#7A6A55]" />
                              Required Documents Readiness: ({readyDocs}/{totalDocs})
                            </span>
                            {isReadyToApply && (
                              <span className="text-xs font-bold text-[#2D4A22] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Apply!
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                            {scheme.required_documents.map((doc) => {
                              const isChecked = !!schemeDocs[doc];
                              return (
                                <button
                                  key={doc}
                                  onClick={() => toggleDoc(scheme.id, doc)}
                                  className={`text-left text-xs px-3 py-2 rounded-md border flex items-center gap-2 transition-all ${
                                    isChecked
                                      ? "bg-[#EBF0E6] border-[#2D4A22] text-[#2D4A22] font-medium"
                                      : "bg-[#FDFAF4] border-[#D9CEB8] text-[#7A6A55] hover:border-[#7A3B2E]"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                      isChecked ? "bg-[#2D4A22] border-[#2D4A22] text-white" : "border-[#D9CEB8]"
                                    }`}
                                  >
                                    {isChecked && <Check className="w-3 h-3" />}
                                  </div>
                                  <span className="truncate">{doc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="mt-5 pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#D9CEB8]/50">
                        <span className="text-xs text-[#7A6A55]">
                          Deadline: {scheme.deadline ? new Date(scheme.deadline).toLocaleDateString("en-IN") : "Ongoing"}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTrackScheme(scheme)}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#F5F1EA] hover:bg-[#EBF0E6] text-[#2D4A22] border border-[#D9CEB8] text-xs font-semibold transition-all shadow-xs cursor-pointer"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5 text-[#2D4A22]" />
                            Track in Profile
                          </button>

                          <a
                            href={scheme.official_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#7A3B2E] hover:bg-[#632f24] text-[#F5F1EA] text-xs font-medium transition-all shadow-xs"
                          >
                            Apply on Official Portal
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PMFBY INSURANCE CALCULATOR */}
        {activeTab === "insurance" && (
          <div>
            {loadingInsurance ? (
              <div className="h-96 bg-[#FDFAF4] animate-pulse border border-[#D9CEB8] rounded-xl" />
            ) : insuranceQuote ? (
              <div className="space-y-8">
                {/* Live Rates & Quotation Card */}
                <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-xl p-6 sm:p-8 shadow-xs">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#D9CEB8]">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCEEEB] text-[#7A3B2E] text-xs font-semibold mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        Pradhan Mantri Fasal Bima Yojana (PMFBY) Statutory Calculator
                      </div>
                      <h2 className="font-display text-2xl font-bold text-[#2C2416]">
                        {insuranceQuote.crop} Crop Protection ({insuranceQuote.season} Season)
                      </h2>
                      <p className="text-xs sm:text-sm text-[#7A6A55] mt-1">
                        Pricing dynamically calibrated against today's live Mandi modal prices and AgriSense Random Forest yield estimates.
                      </p>
                    </div>

                    {/* Climate Alert Indicator */}
                    {insuranceQuote.climate_risk_alert && (
                      <div className="bg-[#F5F1EA] border border-[#D9CEB8] p-3 rounded-lg text-xs max-w-sm">
                        <span className="font-bold text-[#2D4A22] block mb-1 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Climate Advisory
                        </span>
                        <p className="text-[#7A6A55]">{insuranceQuote.climate_risk_alert}</p>
                      </div>
                    )}
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
                    <div className="bg-[#F5F1EA] p-4 rounded-xl border border-[#D9CEB8]">
                      <span className="text-xs text-[#7A6A55] block">Current Mandi Rate</span>
                      <div className="text-xl font-bold font-display text-[#2C2416] mt-1">
                        ₹{insuranceQuote.current_mandi_price_per_quintal.toLocaleString("en-IN")}/Qtl
                      </div>
                      <span className="text-[11px] text-[#7A6A55] mt-1 block">Live wholesale benchmark</span>
                    </div>

                    <div className="bg-[#F5F1EA] p-4 rounded-xl border border-[#D9CEB8]">
                      <span className="text-xs text-[#7A6A55] block">Estimated Yield</span>
                      <div className="text-xl font-bold font-display text-[#2C2416] mt-1">
                        {insuranceQuote.estimated_yield_quintal_per_acre} Qtl/Acre
                      </div>
                      <span className="text-[11px] text-[#7A6A55] mt-1 block">Scale of finance estimate</span>
                    </div>

                    <div className="bg-[#F5F1EA] p-4 rounded-xl border border-[#D9CEB8]">
                      <span className="text-xs text-[#7A6A55] block">Total Sum Insured</span>
                      <div className="text-xl font-bold font-display text-[#2D4A22] mt-1">
                        ₹{insuranceQuote.total_sum_insured.toLocaleString("en-IN")}
                      </div>
                      <span className="text-[11px] text-[#7A6A55] mt-1 block">
                        ₹{insuranceQuote.sum_insured_per_acre.toLocaleString("en-IN")}/acre
                      </span>
                    </div>

                    <div className="bg-[#FCEEEB] p-4 rounded-xl border border-[#7A3B2E]">
                      <span className="text-xs text-[#7A3B2E] font-semibold block">You Pay (Capped Rate)</span>
                      <div className="text-2xl font-bold font-display text-[#7A3B2E] mt-1">
                        ₹{insuranceQuote.farmer_premium_payable.toLocaleString("en-IN")}
                      </div>
                      <span className="text-[11px] text-[#7A3B2E] font-medium mt-1 block">
                        Only {insuranceQuote.farmer_rate_pct}% of Sum Insured
                      </span>
                    </div>
                  </div>

                  {/* Subsidy Bar Visualizer */}
                  <div className="bg-[#F5F1EA] rounded-xl p-5 border border-[#D9CEB8] mb-6">
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-[#7A3B2E]">
                        Farmer Premium: ₹{insuranceQuote.farmer_premium_payable.toLocaleString("en-IN")} ({(100 - insuranceQuote.subsidy_percentage).toFixed(1)}%)
                      </span>
                      <span className="text-[#2D4A22]">
                        Government Paid Subsidy: ₹{insuranceQuote.government_subsidy_amount.toLocaleString("en-IN")} ({insuranceQuote.subsidy_percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-3 bg-[#D9CEB8] rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${100 - insuranceQuote.subsidy_percentage}%` }}
                        className="bg-[#7A3B2E] h-full"
                      />
                      <div
                        style={{ width: `${insuranceQuote.subsidy_percentage}%` }}
                        className="bg-[#2D4A22] h-full"
                      />
                    </div>

                    <p className="text-xs text-[#7A6A55] mt-2">
                      Under PMFBY, the central and state governments co-finance ₹{insuranceQuote.government_subsidy_amount.toLocaleString("en-IN")} directly with the underwriter to keep your insurance affordable.
                    </p>
                  </div>

                  {/* Interactive Sliders to customize */}
                  <div className="pt-4 border-t border-[#D9CEB8]">
                    <h4 className="text-sm font-bold text-[#2C2416] mb-3 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#7A6A55]" />
                      Simulate Farm Size Adjustment
                    </h4>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <input
                        type="range"
                        min="0.5"
                        max="25"
                        step="0.5"
                        value={acres}
                        onChange={(e) => setAcres(parseFloat(e.target.value))}
                        className="w-full h-2 bg-[#D9CEB8] rounded-lg appearance-none cursor-pointer accent-[#7A3B2E]"
                      />
                      <span className="font-bold text-sm text-[#2C2416] shrink-0 w-24 text-right">
                        {acres} Acres
                      </span>
                    </div>
                  </div>
                </div>

                {/* Claim Triggers & Empaneled Providers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Claim Triggers */}
                  <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-xl p-6 shadow-xs">
                    <h3 className="font-display font-bold text-lg text-[#2C2416] mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#C89D3C]" />
                      PMFBY Statutory Claim Coverage Stages
                    </h3>

                    <div className="space-y-3">
                      {insuranceQuote.claim_triggers.map((trigger, idx) => (
                        <div key={idx} className="p-3 bg-[#F5F1EA] rounded-lg border border-[#D9CEB8]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#2C2416]">{trigger.stage}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EBF0E6] text-[#2D4A22]">
                              Up to {trigger.payout_pct}% Sum Insured
                            </span>
                          </div>
                          <p className="text-xs text-[#7A6A55] mt-1">{trigger.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Empaneled Underwriters */}
                  <div className="bg-[#FDFAF4] border border-[#D9CEB8] rounded-xl p-6 shadow-xs">
                    <h3 className="font-display font-bold text-lg text-[#2C2416] mb-4 flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-[#2D4A22]" />
                      Empaneled Underwriters in {state}
                    </h3>

                    <div className="space-y-3">
                      {insuranceQuote.eligible_providers.map((p, idx) => (
                        <div key={idx} className="p-3.5 bg-[#F5F1EA] rounded-lg border border-[#D9CEB8] flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-[#2C2416] block">{p.name}</span>
                            <span className="text-[11px] text-[#7A6A55]">{p.type}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-[#2D4A22] block">
                              {p.claim_settlement_ratio_pct}% Claim Ratio
                            </span>
                            <a
                              href={`tel:${p.helpline}`}
                              className="text-[11px] text-[#7A3B2E] hover:underline flex items-center gap-1 justify-end mt-0.5"
                            >
                              <PhoneCall className="w-3 h-3" />
                              {p.helpline}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 text-center">
                      <a
                        href="https://pmfby.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2D4A22] hover:bg-[#233a1b] text-white text-xs font-medium transition-all shadow-xs"
                      >
                        Enroll on PMFBY Official Portal
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 3: DYNAMIC INGESTION SIMULATOR */}
        {activeTab === "ingest" && (
          <div className="max-w-3xl mx-auto bg-[#FDFAF4] border border-[#D9CEB8] rounded-xl p-6 sm:p-8 shadow-xs">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCEEEB] text-[#7A3B2E] text-xs font-semibold mb-2">
                  <Sparkles className="w-4 h-4 text-[#C89D3C]" />
                  AI Ingestion Pipeline Demonstration
                </div>
                <h2 className="font-display text-2xl font-bold text-[#2C2416]">
                  Simulate New Government Announcement
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6A55] mt-1">
                  Test how newly announced subsidies are parsed by the Groq Llama-3 extraction engine and instantly added to the living AgriSense database without restarting any servers.
                </p>
              </div>

              <button
                type="button"
                onClick={loadPresetAnnouncement}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#7A3B2E] text-[#7A3B2E] hover:bg-[#FCEEEB] transition-all shrink-0"
              >
                Load Sample Circular
              </button>
            </div>

            <form onSubmit={handleIngest} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6A55] mb-1.5">
                  Press Release / Notification Text
                </label>
                <textarea
                  rows={8}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Paste government gazette notice, press information bureau release, or department announcement..."
                  className="w-full bg-[#F5F1EA] border border-[#D9CEB8] rounded-lg p-3 text-xs text-[#2C2416] focus:outline-none focus:border-[#7A3B2E] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6A55] mb-1.5">
                  Official Source Link (Optional)
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://agri.punjab.gov.in/scheme-2026"
                  className="w-full bg-[#F5F1EA] border border-[#D9CEB8] rounded-lg px-3 py-2 text-xs text-[#2C2416] focus:outline-none focus:border-[#7A3B2E]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[#7A6A55]">
                  Extracted via Groq Llama-3 with strict Pydantic schema validation.
                </span>

                <button
                  type="submit"
                  disabled={isIngesting || !announcementText.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#7A3B2E] hover:bg-[#632f24] text-[#F5F1EA] text-xs font-semibold disabled:opacity-50 transition-all shadow-xs"
                >
                  {isIngesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Parsing & Ingesting...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Ingest into Database
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
