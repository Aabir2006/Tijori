"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, Role } from "./types";

export const PRESET_USERS: Record<string, User> = {
  seller: {
    id: "usr_seller_01",
    name: "Arjun Verma",
    email: "arjun.verma@studio.design",
    role: "SELLER",
    roleTitle: "Freelance Creative Lead",
    upiId: "arjun@okhdfcbank",
    phone: "+91 98765 43210",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces",
    isVerified: true,
    memberSince: "Jan 2024",
  },
  buyer: {
    id: "usr_buyer_02",
    name: "Rohan Mehta",
    email: "rohan@hypergrowth.tech",
    role: "BUYER",
    roleTitle: "Product Engineering Lead",
    upiId: "rohan@icici",
    phone: "+91 99887 76655",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
    isVerified: true,
    memberSince: "March 2024",
  },
  admin: {
    id: "usr_admin_00",
    name: "Panchayat Arbitrator",
    email: "compliance@tijoriescrow.in",
    role: "ADMIN",
    roleTitle: "Chief Escrow Arbitrator",
    upiId: "nodal@tijoriescrow",
    phone: "+91 80 4000 1200",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces",
    isVerified: true,
    memberSince: "Inception",
  },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role?: Role, name?: string) => Promise<User>;
  signup: (name: string, email: string, role: Role, phone?: string) => Promise<User>;
  loginAsPreset: (presetKey: "seller" | "buyer" | "admin") => Promise<User>;
  switchRole: (newRole: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "tijori_auth_session_v2";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Clear legacy auto-seeded keys from previous versions
      localStorage.removeItem("tijori_auth_user");

      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User;
        setUser(parsed);
        // keep legacy keys synced for api headers
        localStorage.setItem("tijori_role", parsed.role);
        localStorage.setItem("tijori_name", parsed.name);
      } else {
        // Do NOT auto-login as any demo user!
        // Opening localhost must always be a clean logged-out state unless explicitly authenticated.
        setUser(null);
        localStorage.removeItem("tijori_role");
        localStorage.removeItem("tijori_name");
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSession = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem("tijori_role", newUser.role);
    localStorage.setItem("tijori_name", newUser.name);
  };

  const login = async (email: string, role: Role = "SELLER", name?: string): Promise<User> => {
    // Check if matches any presets
    const match = Object.values(PRESET_USERS).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (match) {
      saveUserSession(match);
      return match;
    }

    const userName = name || email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: userName,
      email,
      role,
      roleTitle: role === "SELLER" ? "Freelance Professional" : role === "BUYER" ? "Verified Client" : "Platform Moderator",
      isVerified: true,
      memberSince: "Nov 2026",
    };
    saveUserSession(newUser);
    return newUser;
  };

  const signup = async (
    name: string,
    email: string,
    role: Role,
    phone?: string
  ): Promise<User> => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      phone: phone?.trim(),
      roleTitle: role === "SELLER" ? "Independent Creator" : role === "BUYER" ? "Verified Buyer" : "Escrow Officer",
      isVerified: true,
      memberSince: "Nov 2026",
    };
    saveUserSession(newUser);
    return newUser;
  };

  const loginAsPreset = async (presetKey: "seller" | "buyer" | "admin"): Promise<User> => {
    const target = PRESET_USERS[presetKey];
    saveUserSession(target);
    return target;
  };

  // Lock roles: no role swapping allowed. Buyer remains buyer, seller remains seller.
  const switchRole = (_newRole: Role) => {
    // Role swapping is permanently disabled
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("tijori_auth_user");
    localStorage.removeItem("tijori_role");
    localStorage.removeItem("tijori_name");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginAsPreset,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
