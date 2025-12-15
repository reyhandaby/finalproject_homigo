"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import api from "@/lib/api";
import { User } from "@/types";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  setUser: () => {},
  logout: () => {},
});

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const logoutTimer = useRef<number | null>(null);

  useEffect(() => {
    initAuth();
    function onStorage(e: StorageEvent) {
      if (e.key === "token" && !e.newValue) {
        autoLogout();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current);
      }
    };
  }, []);

  const initAuth = () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const exp = payload.exp * 1000;

        if (Date.now() >= exp) {
          autoLogout();
        } else {
          setUser({
            id: payload.id,
            role: payload.role,
            email: "",
            name: null,
            avatarUrl: null,
            isVerified: true,
          });
          const ms = exp - Date.now();
          if (logoutTimer.current) {
            clearTimeout(logoutTimer.current);
          }
          logoutTimer.current = window.setTimeout(autoLogout, ms);

          fetchProfile();
        }
      }
    } catch (e) {
      console.error("Error parsing token:", e);
      localStorage.removeItem("token");
      document.cookie = "token=; path=/; max-age=0";
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const resp = await api.get("/users/me");
      const p = resp.data;
      setUser({
        id: p.id,
        role: p.role,
        email: p.email,
        name: p.name || null,
        avatarUrl: p.avatarUrl || null,
        isVerified: !!p.isVerified,
      });
    } catch (e) {}
  };

  const autoLogout = () => {
    try {
      localStorage.removeItem("token");
      document.cookie = "token=; path=/; max-age=0";
    } catch {}
    setUser(null);
    router.replace("/login");
  };

  const logout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within Providers");
  }
  return context;
};
