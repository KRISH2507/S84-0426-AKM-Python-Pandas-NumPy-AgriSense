"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { fetchFieldAlerts, AlertsResponse } from "@/lib/crop_doctor_api";

export default function NavigationBar() {
  const pathname = usePathname();
  const { isAuthenticated, logout, isLoading, user } = useAuth();
  const { language, setLanguage, t, options } = useLanguage();
  const [showLogout, setShowLogout] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFieldAlerts(
        user?.latitude ? Number(user.latitude) : undefined,
        user?.longitude ? Number(user.longitude) : undefined,
        user?.crop || "Wheat",
        user?.state || "Punjab"
      ).then((data) => {
        if (data) setAlertsData(data);
      });
    }
  }, [isAuthenticated, user]);

  const links = [
    { label: t("nav.dashboard"), href: "/dashboard" },
    { label: t("nav.market"), href: "/market" },
    { label: t("nav.mandi"), href: "/mandi" },
    { label: t("nav.climate"), href: "/climate" },
    { label: t("nav.doctor"), href: "/doctor" },
    { label: t("nav.yield"), href: "/yield" },
    { label: t("nav.advisor"), href: "/advisor" },
    { label: t("nav.subsidies"), href: "/subsidies" },
    { label: t("nav.profile"), href: "/profile" },
  ];

  return (
    <>
      <nav className="h-[64px] bg-[#FDFAF4] border-b-[0.5px] border-[#D9CEB8] flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 bg-opacity-95 backdrop-blur z-50">
        <Link href="/" className="font-display font-semibold text-[18px] sm:text-[20px] flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
          <span className="text-[#2C2416]">Agri</span>
          <span className="text-[#7A3B2E]">Sense</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <label className="flex items-center gap-2 font-body text-[12px] text-[#7A6A55]">
            <span className="hidden md:inline">{t("nav.language")}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as typeof language)}
              className="border border-[#D9CEB8] rounded-[20px] px-2 py-1 sm:px-2.5 sm:py-1 text-[12px] bg-[#FDFAF4] text-[#2C2416] focus:outline-none"
              aria-label={t("nav.language")}
            >
              {options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {/* Notification Bell */}
          {!isLoading && isAuthenticated && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                className="p-1.5 sm:p-2 text-[#7A6A55] hover:text-[#7A3B2E] hover:bg-[#F5F1EA] rounded-full transition-colors relative"
                aria-label="Farm Field Alerts"
              >
                <Bell size={18} />
                {alertsData && alertsData.unread_count > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#7A3B2E] rounded-full animate-ping ring-2 ring-white"></span>
                )}
                {alertsData && alertsData.unread_count > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#7A3B2E] rounded-full"></span>
                )}
              </button>

              {/* Dropdown Alert Drawer */}
              {showAlertsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FDFAF4] border border-[#D9CEB8] rounded-[16px] shadow-xl p-4 z-50 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[#D9CEB8]/70 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert size={16} className="text-[#7A3B2E]" />
                      <span className="font-display font-semibold text-[14px] text-[#2C2416]">
                        Farm Field Hazards
                      </span>
                    </div>
                    <span className="text-[11px] font-medium bg-[#EDE3D3] text-[#7A3B2E] px-2 py-0.5 rounded-full">
                      {alertsData?.total_alerts || 0} Active
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {alertsData && alertsData.alerts.length > 0 ? (
                      alertsData.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="p-3 bg-white border border-[#D9CEB8]/80 rounded-[10px] flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EDE3D3] text-[#7A3B2E] px-2 py-0.5 rounded-full">
                              {alert.urgency}
                            </span>
                            <span className="text-[11px] text-[#7A6A55]">{alert.category}</span>
                          </div>
                          <span className="text-[13px] font-semibold text-[#2C2416]">
                            {alert.title}
                          </span>
                          <p className="text-[11px] text-[#7A6A55] leading-relaxed">
                            {alert.description}
                          </p>
                          <Link
                            href={alert.action_link}
                            onClick={() => setShowAlertsDropdown(false)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C7A52] hover:text-[#2D4A22] mt-1"
                          >
                            Take Action in Crop Doctor <ArrowRight size={12} />
                          </Link>
                        </div>
                      ))
                    ) : (
                      <span className="text-[12px] text-[#7A6A55] text-center py-4">
                        All clear! No critical field hazards detected.
                      </span>
                    )}
                  </div>

                  {alertsData?.spray_recommendation && (
                    <div className="text-[11px] text-[#556B4D] bg-[#F1F6EF] p-2.5 rounded-[8px] border border-[#A8C4A1]/50 leading-relaxed">
                      🌿 <strong>Spray Advisor:</strong> {alertsData.spray_recommendation}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6">
            {!isLoading && !isAuthenticated && (
              <div className="flex items-center gap-3">
                <Link href="/" className="font-body text-[13px] text-[#7A6A55] hover:text-[#7A3B2E] transition-colors">{t("nav.home")}</Link>
                <Link href="/signin?mode=signin" className="font-body text-[13px] text-[#7A6A55] hover:text-[#7A3B2E] border border-[#D9CEB8] px-[14px] py-[5px] rounded-[24px] transition-colors">{t("nav.signIn")}</Link>
                <Link href="/signin?mode=signup" className="font-body text-[13px] text-[#F5F0E8] bg-[#7A3B2E] hover:bg-[#683025] px-[16px] py-[6px] rounded-[24px] font-medium transition-colors shadow-xs">{t("signin.tabSignUp")}</Link>
              </div>
            )}
            {!isLoading && isAuthenticated && links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`font-body text-[13px] transition-colors ${
                    isActive
                      ? "text-[#7A3B2E] border-b-[1.5px] border-[#7A3B2E] pb-1"
                      : "text-[#7A6A55] hover:text-[#7A3B2E]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {!isLoading && isAuthenticated && (
              <button
                onClick={() => setShowLogout(true)}
                className="font-body text-[12px] font-medium text-[#7A3B2E] border-[0.5px] border-[#D9CEB8] px-4 py-1.5 rounded-[20px] hover:bg-[#EDE3D3] transition-colors"
              >
                {t("nav.logOut")}
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-[#7A6A55] hover:text-[#2C2416] hover:bg-[#F5F1EA] rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar / Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[64px] z-40 bg-[#FDFAF4] border-t-[0.5px] border-[#D9CEB8] overflow-y-auto lg:hidden">
          <div className="flex flex-col p-4 gap-2">
            {!isLoading && !isAuthenticated && (
              <>
                <Link 
                  href="/" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 font-body text-[15px] text-[#7A6A55] rounded-xl hover:bg-[#F5F1EA]"
                >
                  {t("nav.home")}
                </Link>
                <Link 
                  href="/signin?mode=signin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 font-body text-[15px] text-[#7A6A55] rounded-xl hover:bg-[#F5F1EA]"
                >
                  {t("nav.signIn")}
                </Link>
                <Link 
                  href="/signin?mode=signup" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 font-body text-[15px] text-[#F5F0E8] font-medium bg-[#7A3B2E] hover:bg-[#683025] rounded-xl text-center mt-2 shadow-xs"
                >
                  {t("signin.tabSignUp")}
                </Link>
              </>
            )}

            {!isLoading && isAuthenticated && (
              <>
                {links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={true}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-xl font-body text-[15px] transition-colors ${
                        isActive
                          ? "bg-[#EDE3D3] text-[#7A3B2E] font-medium"
                          : "text-[#7A6A55] hover:bg-[#F5F1EA]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowLogout(true);
                  }}
                  className="mt-4 px-4 py-3 font-body text-[14px] font-medium text-[#7A3B2E] border border-[#D9CEB8] rounded-xl hover:bg-[#EDE3D3] transition-colors text-center"
                >
                  {t("nav.logOut")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#2C2416]/20 backdrop-blur-sm">
          <div className="bg-[#FDFAF4] border-[0.5px] border-[#D9CEB8] rounded-[12px] p-6 max-w-[320px] w-[90%] flex flex-col gap-4 shadow-sm">
            <h3 className="font-display font-semibold text-[18px] text-[#2C2416]">{t("nav.signOut")}</h3>
            <p className="font-body text-[14px] text-[#7A6A55] leading-relaxed">
              {t("nav.signOutConfirm")}
            </p>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowLogout(false)}
                className="px-4 py-2 rounded-[20px] font-body text-[13px] font-medium text-[#7A6A55] hover:bg-[#F5F1EA] transition-colors"
              >
                {t("nav.cancel")}
              </button>
              <button
                onClick={() => {
                  setShowLogout(false);
                  logout();
                }}
                className="px-4 py-2 rounded-[20px] font-body text-[13px] font-medium bg-[#7A3B2E] text-[#F5F0E8] hover:bg-[#683025] transition-colors"
              >
                {t("nav.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
