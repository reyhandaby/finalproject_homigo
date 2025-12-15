"use client";

import Link from "next/link";
import {
  Home,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Homigo</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Platform booking properti terpercaya untuk menemukan akomodasi
              impian Anda di seluruh Indonesia.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/properties"
                  className="hover:text-blue-400 transition"
                >
                  Cari Properti
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-400 transition">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="hover:text-blue-400 transition"
                >
                  Cara Kerja
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-blue-400 transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Untuk Pemilik
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/register?role=TENANT"
                  className="hover:text-blue-400 transition"
                >
                  Daftar sebagai Tenant
                </Link>
              </li>
              <li>
                <Link
                  href="/tenant/dashboard"
                  className="hover:text-blue-400 transition"
                >
                  Dashboard Tenant
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-blue-400 transition"
                >
                  Harga & Paket
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="hover:text-blue-400 transition"
                >
                  Panduan & Tips
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-lg mb-4">
              Hubungi Kami
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Mail className="w-5 h-5 mt-0.5" />
                <a
                  href="mailto:info@homigo.com"
                  className="hover:text-blue-400 transition"
                >
                  info@homigo.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-5 h-5 mt-0.5" />
                <a
                  href="tel:+628123456789"
                  className="hover:text-blue-400 transition"
                >
                  +62 812-3456-789
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 mt-0.5" />
                <span className="text-sm">
                  Jl. Sudirman No. 123
                  <br />
                  Jakarta Pusat, 10220
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © {currentYear} Homigo. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-blue-400 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-blue-400 transition">
              Terms of Service
            </Link>
            <Link href="/cookies" className="hover:text-blue-400 transition">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
