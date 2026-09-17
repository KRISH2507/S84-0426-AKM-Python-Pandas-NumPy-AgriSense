"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { Sparkles, UserPlus, LogIn, ArrowRight } from "lucide-react";

const INDIAN_STATES = [
  "Punjab",
  "Haryana",
  "Uttar Pradesh",
  "Maharashtra",
  "Rajasthan",
  "Madhya Pradesh",
  "Himachal Pradesh",
  "Tamil Nadu",
  "Karnataka",
  "Gujarat",
  "Andhra Pradesh",
  "Bihar",
];

const COMMON_CROPS = [
  "Wheat",
  "Rice",
  "Maize",
  "Cotton",
  "Sugarcane",
  "Soybean",
  "Tomato",
  "Potato",
  "Mustard",
  "Chickpea",
];

function AuthForm() {
  const { login, signup, loginDemo, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam = searchParams.get("mode");
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(
    modeParam === "signup" ? "signup" : "signin"
  );

  // Sync tab with URL if mode query param changes
  useEffect(() => {
    if (modeParam === "signup") {
      setActiveTab("signup");
    } else if (modeParam === "signin") {
      setActiveTab("signin");
    }
  }, [modeParam]);

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [isSignInSubmitting, setIsSignInSubmitting] = useState(false);

  // Sign Up Form States
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpLocation, setSignUpLocation] = useState("Punjab");
  const [signUpCrop, setSignUpCrop] = useState("Wheat");
  const [signUpAcres, setSignUpAcres] = useState("5");
  const [isSignUpSubmitting, setIsSignUpSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Handle standard email/password Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = signInEmail.trim();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsSignInSubmitting(true);
    try {
      // 1. Authenticate in local app context
      const success = login({
        email: email,
        password: signInPassword,
      });

      if (success) {
        // 2. Synchronize NextAuth session
        await signIn("credentials", {
          redirect: false,
          email: email,
          password: signInPassword || "demo",
        });
      }
    } catch (error) {
      console.error("SignIn error:", error);
      toast.error("An error occurred during sign in.");
    } finally {
      setIsSignInSubmitting(false);
    }
  };

  // Handle new user Sign Up (Registration)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!signUpEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (signUpPassword && signUpPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    setIsSignUpSubmitting(true);
    try {
      // 1. Register and log in in local context
      const success = signup({
        name: signUpName.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword || "demo",
        location: signUpLocation,
        crop: signUpCrop,
        acres: parseFloat(signUpAcres) || 5,
        season: "Rabi",
      });

      if (success) {
        // 2. Synchronize NextAuth session
        await signIn("credentials", {
          redirect: false,
          email: signUpEmail.trim(),
          password: signUpPassword || "demo",
        });
      }
    } catch (error) {
      console.error("SignUp error:", error);
      toast.error("Failed to register account.");
    } finally {
      setIsSignUpSubmitting(false);
    }
  };

  // Handle quick demo login
  const handleDemoAccess = () => {
    loginDemo();
  };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (err) {
      console.error("Google sign in error:", err);
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full py-8">
      <div className="bg-[#FDFAF4] border-[0.5px] border-[#D9CEB8] rounded-[20px] p-6 sm:p-10 w-[92%] max-w-[440px] flex flex-col gap-6 shadow-sm">
        {/* Toggle Switch between Sign In and Create Account */}
        <div className="flex bg-[#F5F1EA] p-1 rounded-[14px] border-[0.5px] border-[#D9CEB8]">
          <button
            type="button"
            onClick={() => setActiveTab("signin")}
            className={`flex-1 py-2 rounded-[10px] font-body text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "signin"
                ? "bg-[#FDFAF4] text-[#7A3B2E] shadow-sm border-[0.5px] border-[#D9CEB8]"
                : "text-[#7A6A55] hover:text-[#2C2416]"
            }`}
          >
            <LogIn size={15} />
            {t("signin.tabSignIn")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-2 rounded-[10px] font-body text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "signup"
                ? "bg-[#FDFAF4] text-[#7A3B2E] shadow-sm border-[0.5px] border-[#D9CEB8]"
                : "text-[#7A6A55] hover:text-[#2C2416]"
            }`}
          >
            <UserPlus size={15} />
            {t("signin.tabSignUp")}
          </button>
        </div>

        {/* Header Titles */}
        <div className="text-center flex flex-col gap-1.5">
          <h1 className="font-display font-semibold text-[26px] sm:text-[28px] text-[#2C2416]">
            {activeTab === "signin" ? t("signin.welcome") : t("signup.title")}
          </h1>
          <p className="font-body text-[13px] text-[#7A6A55] leading-relaxed">
            {activeTab === "signin" ? t("signin.subtitle") : t("signup.subtitle")}
          </p>
        </div>

        {/* ── TAB 1: SIGN IN FORM ── */}
        {activeTab === "signin" && (
          <form className="flex flex-col gap-4 w-full" onSubmit={handleSignIn}>
            <div className="flex flex-col gap-1">
              <label className="font-body font-medium text-[11px] text-[#7A6A55] uppercase tracking-[0.1em]">
                {t("signin.email")}
              </label>
              <input
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="e.g. rajan@farm.com"
                className="h-[44px] bg-[#F5F1EA] border-[0.5px] border-[#D9CEB8] rounded-[10px] px-3.5 font-body text-[13px] text-[#2C2416] focus:outline-none focus:border-[#7A3B2E] transition-colors placeholder-[#A89E89]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-body font-medium text-[11px] text-[#7A6A55] uppercase tracking-[0.1em]">
                {t("signin.password")}
              </label>
              <input
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                className="h-[44px] bg-[#F5F1EA] border-[0.5px] border-[#D9CEB8] rounded-[10px] px-3.5 font-body text-[13px] text-[#2C2416] focus:outline-none focus:border-[#7A3B2E] transition-colors placeholder-[#A89E89]"
              />
            </div>

            <button
              type="submit"
              disabled={isSignInSubmitting}
              className="bg-[#7A3B2E] text-[#F5F0E8] w-full py-[12px] rounded-[24px] font-medium text-[14px] text-center mt-2 hover:bg-[#683025] transition-colors shadow-sm cursor-pointer disabled:opacity-75"
            >
              {isSignInSubmitting ? "Signing in..." : t("signin.submit")}
            </button>

            {/* Quick Demo Access Button */}
            <button
              type="button"
              onClick={handleDemoAccess}
              className="bg-[#EDE3D3]/70 border border-[#D9CEB8] text-[#5C7A52] w-full py-[10px] rounded-[24px] font-body font-medium text-[12px] flex items-center justify-center gap-1.5 hover:bg-[#EDE3D3] transition-colors cursor-pointer"
            >
              <Sparkles size={14} className="text-[#5C7A52]" />
              {t("signin.demo")} (Rajan · 5 Acres Wheat)
            </button>
          </form>
        )}

        {/* ── TAB 2: SIGN UP FORM ── */}
        {activeTab === "signup" && (
          <form className="flex flex-col gap-3.5 w-full" onSubmit={handleSignUp}>
            <div className="flex flex-col gap-1">
              <label className="font-body font-medium text-[11px] text-[#7A6A55] uppercase tracking-[0.1em]">
                {t("signup.name")} *
              </label>
              <input
                type="text"
                required
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="h-[42px] bg-[#F5F1EA] border-[0.5px] border-[#D9CEB8] rounded-[10px] px-3.5 font-body text-[13px] text-[#2C2416] focus:outline-none focus:border-[#7A3B2E] transition-colors placeholder-[#A89E89]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-body font-medium text-[11px] text-[#7A6A55] uppercase tracking-[0.1em]">
                {t("signin.email")} *
              </label>
              <input
                type="email"
                required
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="e.g. ramesh@farm.com"
                className="h-[42px] bg-[#F5F1EA] border-[0.5px] border-[#D9CEB8] rounded-[10px] px-3.5 font-body text-[13px] text-[#2C2416] focus:outline-none focus:border-[#7A3B2E] transition-colors placeholder-[#A89E89]"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-body font-medium text-[11px] text-[#7A6A55] uppercase tracking-[0.1em]">
                {t("signin.password")}
              </label>
              <input
                type="password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="h-[42px] bg-[#F5F1EA] border-[0.5px] border-[#D9CEB8] rounded-[10px] px-3.5 font-body text-[13px] text-[#2C2416] focus:outline-none focus:border-[#7A3B2E] transition-colors placeholder-[#A89E89]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-body font-medium text-[11px] text-[#7A6A55] uppercase tracking-[0.1em]">
                  {t("signup.location")}
                </label>
                <select
                  value={signUpLocation}
                  onChange={(e) => setSignUpLocation(e.target.value)}
                  className="h-[42px] bg-[#F5F1EA] border-[0.5px] border-[#D9CEB8] rounded-[10px] px-2.5 font-body text-[12px] text-[#2C2416] focus:outline-none focus:border-[#7A3B2E] transition-colors cursor-pointer"
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-body font-medium text-[11px] text-[#7A6A55] uppercase tracking-[0.1em]">
                  {t("signup.crop")}
                </label>
                <select
                  value={signUpCrop}
                  onChange={(e) => setSignUpCrop(e.target.value)}
                  className="h-[42px] bg-[#F5F1EA] border-[0.5px] border-[#D9CEB8] rounded-[10px] px-2.5 font-body text-[12px] text-[#2C2416] focus:outline-none focus:border-[#7A3B2E] transition-colors cursor-pointer"
                >
                  {COMMON_CROPS.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-body font-medium text-[11px] text-[#7A6A55] uppercase tracking-[0.1em]">
                {t("signup.acres")}
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={signUpAcres}
                onChange={(e) => setSignUpAcres(e.target.value)}
                placeholder="e.g. 5"
                className="h-[42px] bg-[#F5F1EA] border-[0.5px] border-[#D9CEB8] rounded-[10px] px-3.5 font-body text-[13px] text-[#2C2416] focus:outline-none focus:border-[#7A3B2E] transition-colors placeholder-[#A89E89]"
              />
            </div>

            <button
              type="submit"
              disabled={isSignUpSubmitting}
              className="bg-[#7A3B2E] text-[#F5F0E8] w-full py-[12px] rounded-[24px] font-medium text-[14px] text-center mt-2 hover:bg-[#683025] transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {isSignUpSubmitting ? "Creating Account..." : t("signup.submit")}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* ── GOOGLE OAUTH SECTION ── */}
        <div className="flex flex-col gap-4">
          <div className="relative border-t-[0.5px] border-[#D9CEB8] w-full flex items-center justify-center">
            <span className="bg-[#FDFAF4] px-3 absolute text-[11px] text-[#7A6A55] uppercase tracking-[0.05em]">
              {t("signin.or")}
            </span>
          </div>

          <button
            onClick={handleGoogleSignIn}
            type="button"
            className="border-[0.5px] border-[#D9CEB8] text-[#2C2416] w-full py-[11px] rounded-[24px] font-medium text-[13px] flex items-center justify-center gap-2 hover:bg-[#F5F1EA] transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("signin.google")}
          </button>
        </div>

        {/* Bottom Switcher Helper Link */}
        <div className="text-center pt-2 border-t-[0.5px] border-[#E8DFC9]">
          {activeTab === "signin" ? (
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className="font-body text-[12px] text-[#7A6A55] hover:text-[#7A3B2E] transition-colors"
            >
              {t("signin.noAccount")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className="font-body text-[12px] text-[#7A6A55] hover:text-[#7A3B2E] transition-colors"
            >
              {t("signin.haveAccount")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="font-body text-[14px] text-[#7A6A55] animate-pulse">Loading AgriSense Auth...</p>
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
