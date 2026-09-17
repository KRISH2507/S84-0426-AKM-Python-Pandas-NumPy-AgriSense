"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-[1100px] mx-auto text-center px-4 gap-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-6 mt-12">
        <h1 className="font-display font-semibold text-[36px] md:text-[48px] text-[#2C2416] leading-tight max-w-[800px]">
          {t("landing.heroTitle")}
        </h1>
        <p className="font-body text-[16px] md:text-[18px] text-[#7A6A55] max-w-[600px] leading-relaxed">
          {t("landing.heroSubtitle")}
        </p>
        <div className="flex gap-4 mt-4">
          <Link
            href="/signin?mode=signup"
            className="bg-[#7A3B2E] text-[#F5F0E8] rounded-[24px] px-[28px] py-[12px] font-medium text-[14px] hover:opacity-90 transition-opacity"
          >
            {t("landing.getStarted")}
          </Link>
          <Link
            href="/signin?mode=signin"
            className="border border-[#7A3B2E] text-[#7A3B2E] rounded-[24px] px-[28px] py-[12px] font-medium text-[14px] hover:bg-[#EDE3D3] transition-colors"
          >
            {t("nav.signIn")}
          </Link>
        </div>
      </section>

      {/* Features - 3 Columns */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
        {[
          {
            title: t("landing.featureDemandTitle"),
            desc: t("landing.featureDemandDesc"),
          },
          {
            title: t("landing.featurePriceTitle"),
            desc: t("landing.featurePriceDesc"),
          },
          {
            title: t("landing.featureClimateTitle"),
            desc: t("landing.featureClimateDesc"),
          },
        ].map((feature, idx) => (
          <div
            key={idx}
            className="bg-[#FDFAF4] border-[0.5px] border-[#D9CEB8] rounded-[12px] p-[24px] flex flex-col gap-3 text-left"
          >
            <h3 className="font-display font-semibold text-[18px] text-[#2C2416]">
              {feature.title}
            </h3>
            <p className="font-body font-light text-[14px] text-[#7A6A55] leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <section className="flex flex-col items-center gap-8 w-full mt-10">
        <h2 className="font-display italic text-[24px] text-[#5C7A52]">
          {t("landing.howItWorks")}
        </h2>
        <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
          {[
            { step: t("landing.step1"), text: t("landing.step1Text") },
            { step: t("landing.step2"), text: t("landing.step2Text") },
            { step: t("landing.step3"), text: t("landing.step3Text") },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center gap-2 p-4 bg-[#F5F1EA] rounded-[10px]"
            >
              <span className="font-medium text-[11px] uppercase tracking-[0.1em] text-[#7A3B2E]">
                {item.step}
              </span>
              <p className="font-body text-[14px] text-[#2C2416] font-medium">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="mt-16 border-t-[0.5px] border-[#E8DFC9] pt-6 w-full text-center">
        <p className="font-body text-[12px] text-[#7A6A55]">
          {t("landing.footer")}
        </p>
      </footer>
    </div>
  );
}
