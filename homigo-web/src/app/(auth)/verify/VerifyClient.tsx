/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function VerifyClient() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token && !email) {
      toast.error("Invalid verification link");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!token) {
      toast.error("Verification token is missing");
      return;
    }

    setIsLoading(true);

    try {
      await authApi.verify({ token, password });
      toast.success("Email verified successfully! You can now login.");
      router.replace("/login");
    } catch (error: any) {
      const message = error.response?.data?.message || "Verification failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">✉️</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Email</h1>
        {email && (
          <p className="text-gray-600">
            Verification email sent to{" "}
            <span className="font-semibold">{email}</span>
          </p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          Check your inbox and click the verification link, or enter your
          details below
        </p>
      </div>

      {token ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Create Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Verifying..." : "Verify & Set Password"}
          </button>
        </form>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Please check your email for the verification link
          </p>
          <p className="text-sm text-gray-500">
            Didn't receive the email?{" "}
            <button className="text-blue-600 hover:text-blue-700 font-semibold">
              Resend
            </button>
          </p>
        </div>
      )}

      <p className="mt-8 text-center text-sm text-gray-600">
        <Link
          href="/login"
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}

