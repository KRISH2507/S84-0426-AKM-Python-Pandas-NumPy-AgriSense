"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut, useSession } from "next-auth/react";

export interface UserProfile {
  name: string;
  email?: string;
  crop: string;
  season: string;
  acres: number;
  location: string;
  district?: string;
  lat?: number;
  lng?: number;
  soilType?: string;
  elevation?: number;
}

export interface StoredUser extends UserProfile {
  email: string;
  password?: string;
  createdAt: string;
  updatedAt?: string;
}

const defaultProfile: UserProfile = {
  name: "Rajan",
  email: "farmer@agrisense.com",
  crop: "Wheat",
  season: "Rabi",
  acres: 5,
  location: "Punjab",
  district: "Ludhiana",
  lat: 30.9010,
  lng: 75.8573,
  soilType: "Alluvial",
  elevation: 250,
};

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile;
  login: (options?: { email?: string; password?: string; profile?: Partial<UserProfile> }) => boolean;
  signup: (userData: {
    name: string;
    email: string;
    password?: string;
    location: string;
    crop: string;
    acres: number;
    season?: string;
  }) => boolean;
  loginDemo: () => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: defaultProfile,
  login: () => false,
  signup: () => false,
  loginDemo: () => {},
  logout: () => {},
  updateProfile: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile>(defaultProfile);
  const router = useRouter();

  // Helper to ensure default seed demo user exists
  const ensureSeedUsers = () => {
    try {
      const usersStr = localStorage.getItem("agrisense_users");
      if (!usersStr) {
        const seedUsers: Record<string, StoredUser> = {
          "farmer@agrisense.com": {
            ...defaultProfile,
            email: "farmer@agrisense.com",
            password: "demo",
            createdAt: new Date().toISOString(),
          },
        };
        localStorage.setItem("agrisense_users", JSON.stringify(seedUsers));
      }
    } catch (e) {
      console.error("Seed users error:", e);
    }
  };

  // 1. Sync with NextAuth session (Google OAuth or Credentials)
  useEffect(() => {
    ensureSeedUsers();

    if (sessionStatus === "loading") {
      return;
    }

    if (sessionStatus === "authenticated" && session?.user?.email) {
      const email = session.user.email.trim().toLowerCase();
      try {
        const usersStr = localStorage.getItem("agrisense_users");
        const users: Record<string, StoredUser> = usersStr ? JSON.parse(usersStr) : {};
        const existing = users[email];

        if (existing) {
          // User already exists: restore all saved information (name, farm location, crop, acres, soil, lat/lng, etc.)
          const loadedProfile: UserProfile = {
            ...defaultProfile,
            ...existing,
            email: email,
          };
          setUser(loadedProfile);
          setIsAuthenticated(true);
          sessionStorage.setItem("agrisense_auth", "true");
          localStorage.setItem("agrisense_profile", JSON.stringify(loadedProfile));
        } else {
          // New Google account: initialize entry with Google details and persist to repository
          const initialName = session.user.name || email.split("@")[0];
          const newProfile: UserProfile = {
            ...defaultProfile,
            name: initialName,
            email: email,
          };
          users[email] = {
            ...newProfile,
            email: email,
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem("agrisense_users", JSON.stringify(users));
          setUser(newProfile);
          setIsAuthenticated(true);
          sessionStorage.setItem("agrisense_auth", "true");
          localStorage.setItem("agrisense_profile", JSON.stringify(newProfile));
        }
      } catch (err) {
        console.error("Google session profile sync error:", err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. If NextAuth is unauthenticated, check local session storage (credentials or demo)
    if (sessionStatus === "unauthenticated") {
      try {
        const authStatus = sessionStorage.getItem("agrisense_auth");
        if (authStatus === "true") {
          const savedProfile = localStorage.getItem("agrisense_profile");
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            if (parsed.email) {
              const usersStr = localStorage.getItem("agrisense_users");
              const users: Record<string, StoredUser> = usersStr ? JSON.parse(usersStr) : {};
              const fresh = users[parsed.email.toLowerCase()];
              if (fresh) {
                const merged = { ...defaultProfile, ...fresh };
                setUser(merged);
                setIsAuthenticated(true);
                setIsLoading(false);
                return;
              }
            }
            setUser(parsed);
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (e) {
        console.error("Local auth init error:", e);
      } finally {
        setIsLoading(false);
      }
    }
  }, [sessionStatus, session]);

  const login = (options?: { email?: string; password?: string; profile?: Partial<UserProfile> }): boolean => {
    const email = options?.email?.trim().toLowerCase();
    const password = options?.password;

    let matchedProfile: UserProfile = { ...defaultProfile };

    if (email) {
      try {
        const usersStr = localStorage.getItem("agrisense_users");
        const users: Record<string, StoredUser> = usersStr ? JSON.parse(usersStr) : {};
        const existing = users[email];

        if (existing) {
          if (password && existing.password && existing.password !== password) {
            toast.error("Incorrect password. Please try again.", {
              style: { background: "#EDE3D3", color: "#7A3B2E", border: "0.5px solid #D9CEB8" },
              className: "font-body",
            });
            return false;
          }
          // Restore ALL saved profile fields
          matchedProfile = {
            ...defaultProfile,
            ...existing,
            email: existing.email,
          };
        } else {
          // New login with email without prior signup
          const nameFromEmail = email.split("@")[0];
          const capitalized = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
          matchedProfile = {
            ...defaultProfile,
            name: capitalized,
            email: email,
            ...(options?.profile || {}),
          };
          users[email] = {
            ...matchedProfile,
            email: email,
            password: password || "demo",
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem("agrisense_users", JSON.stringify(users));
        }
      } catch (err) {
        console.error("Login parse error:", err);
      }
    } else if (options?.profile) {
      matchedProfile = { ...defaultProfile, ...options.profile };
    }

    sessionStorage.setItem("agrisense_auth", "true");
    localStorage.setItem("agrisense_profile", JSON.stringify(matchedProfile));
    setUser(matchedProfile);
    setIsAuthenticated(true);

    toast.success(`Welcome back, ${matchedProfile.name}!`, {
      style: { background: "#F5F1EA", color: "#2C2416", border: "0.5px solid #D9CEB8" },
      className: "font-body",
    });
    router.push("/dashboard");
    return true;
  };

  const signup = (userData: {
    name: string;
    email: string;
    password?: string;
    location: string;
    crop: string;
    acres: number;
    season?: string;
  }): boolean => {
    const email = userData.email.trim().toLowerCase();
    if (!email || !userData.name.trim()) {
      toast.error("Please provide both name and email.", {
        style: { background: "#EDE3D3", color: "#7A3B2E", border: "0.5px solid #D9CEB8" },
        className: "font-body",
      });
      return false;
    }

    try {
      const usersStr = localStorage.getItem("agrisense_users");
      const users: Record<string, StoredUser> = usersStr ? JSON.parse(usersStr) : {};

      const newUser: StoredUser = {
        name: userData.name.trim(),
        email: email,
        password: userData.password || "demo",
        location: userData.location || "Punjab",
        crop: userData.crop || "Wheat",
        acres: Number(userData.acres) || 5,
        season: userData.season || "Rabi",
        createdAt: new Date().toISOString(),
      };

      users[email] = newUser;
      localStorage.setItem("agrisense_users", JSON.stringify(users));

      const profile: UserProfile = {
        ...defaultProfile,
        ...newUser,
      };

      sessionStorage.setItem("agrisense_auth", "true");
      localStorage.setItem("agrisense_profile", JSON.stringify(profile));
      setUser(profile);
      setIsAuthenticated(true);

      toast.success(`Account created! Welcome to AgriSense, ${newUser.name}!`, {
        style: { background: "#F5F1EA", color: "#2C2416", border: "0.5px solid #D9CEB8" },
        className: "font-body",
      });
      router.push("/dashboard");
      return true;
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Failed to create account. Please try again.");
      return false;
    }
  };

  const loginDemo = () => {
    sessionStorage.setItem("agrisense_auth", "true");
    localStorage.setItem("agrisense_profile", JSON.stringify(defaultProfile));
    setUser(defaultProfile);
    setIsAuthenticated(true);

    toast.success("Signed in with Demo Farm Account (Rajan, Punjab)", {
      style: { background: "#F5F1EA", color: "#2C2416", border: "0.5px solid #D9CEB8" },
      className: "font-body",
    });
    router.push("/dashboard");
  };

  const logout = async () => {
    sessionStorage.removeItem("agrisense_auth");
    localStorage.removeItem("agrisense_profile");
    setIsAuthenticated(false);
    setUser(defaultProfile);
    try {
      await signOut({ redirect: false });
    } catch (e) {
      console.error("SignOut error:", e);
    }
    toast("You have been signed out", {
      style: { background: "#F5F1EA", color: "#7A6A55", border: "0.5px solid #D9CEB8" },
      className: "font-body",
    });
    router.push("/");
  };

  const updateProfile = (profileUpdates: Partial<UserProfile>) => {
    setUser((prev) => {
      const activeEmail = (profileUpdates.email || prev.email || session?.user?.email || "").trim().toLowerCase();
      const updated: UserProfile = {
        ...prev,
        ...profileUpdates,
        email: activeEmail || prev.email,
      };

      // 1. Update active session cache
      localStorage.setItem("agrisense_profile", JSON.stringify(updated));

      // 2. Persist to permanent users repository keyed by email
      if (activeEmail) {
        try {
          const usersStr = localStorage.getItem("agrisense_users");
          const users: Record<string, StoredUser> = usersStr ? JSON.parse(usersStr) : {};
          users[activeEmail] = {
            ...(users[activeEmail] || {}),
            ...updated,
            email: activeEmail,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem("agrisense_users", JSON.stringify(users));
        } catch (err) {
          console.error("Profile store update error:", err);
        }
      }

      return updated;
    });

    toast.success("Profile updated successfully", {
      style: { background: "#F5F1EA", color: "#2C2416", border: "0.5px solid #D9CEB8" },
      className: "font-body",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        signup,
        loginDemo,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
