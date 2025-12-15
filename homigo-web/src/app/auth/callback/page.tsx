"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const sp = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const token = sp.get("token");
    const role = sp.get("role");
    if (token) localStorage.setItem("token", token);
    if (role === "TENANT") router.replace("/tenant/dashboard"); else router.replace("/");
  }, [sp, router]);
  return <div className="p-6">Mengautentikasi...</div>;
}
