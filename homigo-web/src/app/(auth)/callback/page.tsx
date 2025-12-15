"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers";
import toast from "react-hot-toast";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = () => {
    try {
      const token = searchParams.get("token");
      const role = searchParams.get("role");

      if (!token) {
        toast.error("Authentication failed");
        router.push("/login");
        return;
      }

      localStorage.setItem("token", token);

      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        id: payload.id,
        role: payload.role,
        email: "",
        name: null,
        avatarUrl: null,
        isVerified: true,
      });

      toast.success("Login successful!");

      if (role === "TENANT") {
        router.push("/dashboard");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Callback error:", error);
      toast.error("Authentication failed");
      router.push("/login");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authenticating...
        </h1>
        <p className="text-gray-600">Please wait while we sign you in</p>
      </div>
    </div>
  );
}
