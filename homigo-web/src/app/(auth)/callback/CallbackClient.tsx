/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers";
import toast from "react-hot-toast";

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  useEffect(() => {
    try {
      const token = searchParams.get("token");
      const role = searchParams.get("role");

      if (!token) {
        toast.error("Authentication failed");
        router.replace("/login");
        return;
      }

      try {
        localStorage.setItem("token", token);
      } catch {}

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
        router.replace("/dashboard");
      } else {
        router.replace("/");
      }
    } catch (error) {
      toast.error("Authentication failed");
      router.replace("/login");
    }
  }, []);

  return null;
}

