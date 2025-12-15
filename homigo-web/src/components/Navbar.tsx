"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { api } from "../lib/api";
import {
  Building2,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  BookOpen,
} from "lucide-react";

type Me = {
  id: string;
  name?: string;
  email: string;
  avatarUrl?: string;
  role?: "USER" | "TENANT";
};

export function Navbar() {
  const [me, setMe] = useState<Me | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ============================
  // LOAD USER / TENANT PROFILE
  // ============================
  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // PRIORITY: TENANT FIRST
        const tenantMe = await api.get("/tenants/me").catch(() => null);
        if (tenantMe?.data) {
          setMe({ ...tenantMe.data, role: "TENANT" });
          return;
        }

        // FALLBACK: USER
        const userMe = await api.get("/users/me");
        setMe({ ...userMe.data, role: "USER" });
      } catch (err) {
        console.error("AUTH ERROR:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setMe(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // LOGOUT
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMe(null);
    window.location.href = "/";
  }

  // DYNAMIC PROFILE LINK
  const profileHref =
    me?.role === "TENANT" ? "/tenant/profile" : "/profile";

  const dashboardHref =
    me?.role === "TENANT" ? "/tenant/dashboard" : "/dashboard";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="font-semibold text-xl text-blue-600 hover:text-blue-700 transition tracking-tight"
          >
            Homigo
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/properties"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium"
            >
              <Building2 className="w-5 h-5" />
              Properti
            </Link>

            {me && me.role === "USER" && (
              <Link
                href="/bookings"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium"
              >
                <Calendar className="w-5 h-5" />
                Booking Saya
              </Link>
            )}

            {me?.role === "TENANT" && (
              <Link
                href="/tenant/dashboard"
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition font-medium"
              >
                <BookOpen className="w-5 h-5" />
                Dashboard Tenant
              </Link>
            )}
          </div>

          {/* Right Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            ) : me ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                    {me.avatarUrl ? (
                      <Image
                        src={me.avatarUrl}
                        alt={me.name || "User"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <span className="text-sm font-medium text-gray-700">
                    {me.name || me.email.split("@")[0]}
                  </span>

                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      profileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {me.name}
                      </p>
                      <p className="text-xs text-gray-500">{me.email}</p>

                      {me.role === "TENANT" && (
                        <span className="inline-flex mt-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                          Tenant
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      <Link
                        href={profileHref}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="w-4 h-4" />
                        Profile Saya
                      </Link>

                      {me.role === "USER" && (
                        <Link
                          href="/bookings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Calendar className="w-4 h-4" />
                          Booking Saya
                        </Link>
                      )}

                      {me.role === "TENANT" && (
                        <Link
                          href={dashboardHref}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <BookOpen className="w-4 h-4" />
                          Dashboard Tenant
                        </Link>
                      )}

                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4" />
                        Pengaturan
                      </Link>
                    </div>

                    <div className="border-t border-gray-100">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
