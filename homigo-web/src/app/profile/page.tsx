"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../../lib/api";
import { useRouter } from "next/navigation";

type Me = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role?: "USER" | "TENANT";
};

const profileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(8, "Minimal 8 karakter"),
  newPassword: z.string().min(8, "Minimal 8 karakter"),
});

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ name: string }>({
    resolver: zodResolver(profileSchema),
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register: pwReg,
    handleSubmit: pwSubmit,
    formState: { errors: pwErrors },
    reset: pwReset,
  } = useForm<{ oldPassword: string; newPassword: string }>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    api.get("/users/me")
      .then((r) => {
        setMe(r.data as Me);
        reset({
          name: r.data?.name || "",
        });
      })
      .catch(() => {
        setMe(null);
        router.replace("/login");
      });
  }, [router, reset]);

  async function onSaveProfile(v: { name: string }) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const r1 = await api.put("/users/me", { name: v.name });
      let updated = r1.data as Me;

      if (avatarFile) {
        if (avatarFile.size > 2 * 1024 * 1024) {
          throw { response: { data: { message: "Ukuran file maksimal 2MB" } } };
        }
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(avatarFile.type)
        ) {
          throw {
            response: {
              data: { message: "Tipe file harus jpg, png, atau webp" },
            },
          };
        }
        const form = new FormData();
        form.append("avatar", avatarFile);
        const r2 = await api.post("/users/me/avatar", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updated = r2.data as Me;
      }

      setMe(updated);
      setSuccess("✅ Profil berhasil diperbarui!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "❌ Gagal menyimpan profil. Silakan coba lagi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onChangePassword(v: {
    oldPassword: string;
    newPassword: string;
  }) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.post("/users/me/password", v);
      pwReset();
      setSuccess("✅ Password berhasil diubah!");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "❌ Gagal mengubah password. Periksa password lama Anda."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
      {/* Tombol kecil kembali ke beranda (kanan atas) */}
        <div className="flex justify-end mb-4">
          <button
    type="button"
    onClick={() => {
      if (me?.role === "TENANT") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    }}
    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 transition"
  >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Beranda
          </button>
        </div>
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="relative">
              {me.avatarUrl ? (
                <img
                  src={me.avatarUrl}
                  alt={me.name || "User"}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-500">
                  {me.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {me.name || "User"}
              </h1>
              <p className="text-gray-600 flex items-center mt-1">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                {me.email}
              </p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                  me.role === "TENANT"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {me.role === "TENANT" ? "🏢 Tenant" : "👤 User"}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center mb-6">
            <svg
              className="w-6 h-6 text-blue-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">
              Informasi Profil
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Foto Profil (jpg, png, webp) max 2MB
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                "💾 Simpan Profil"
              )}
            </button>
          </form>
        </div>

        {/* Password Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <svg
              className="w-6 h-6 text-purple-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900">Ubah Password</h2>
          </div>

          <form onSubmit={pwSubmit(onChangePassword)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password Lama <span className="text-red-500">*</span>
              </label>
              <input
                {...pwReg("oldPassword")}
                type="password"
                placeholder="Masukkan password lama"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
              {pwErrors.oldPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {pwErrors.oldPassword.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <input
                {...pwReg("newPassword")}
                type="password"
                placeholder="Masukkan password baru (min. 8 karakter)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
              {pwErrors.newPassword && (
                <p className="mt-2 text-sm text-red-600">
                  {pwErrors.newPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                "🔒 Simpan Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
