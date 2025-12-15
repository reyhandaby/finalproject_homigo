/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CallbackHandler() {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = sp.get("token");
    const role = sp.get("role");
    if (token) {
      try {
        localStorage.setItem("token", token);
      } catch {}
    }
    if (role === "TENANT") {
      router.replace("/tenant/dashboard");
    } else {
      router.replace("/");
    }
  }, []);

  return null;
}

