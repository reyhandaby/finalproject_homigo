"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

interface DashboardStats {
  totalProperties: number;
  totalBookings: number;
  revenue: number;
}

interface RecentBooking {
  id: string;
  property: { name: string };
  user: { name: string; email: string };
  createdAt: string;
  checkInDate?: string; // backend does not return these unless added
  checkOutDate?: string;
  totalPrice?: number;
  status?: string;
}

export default function TenantDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "TENANT") {
      router.push("/");
      return;
    }

    if (user) fetchDashboardData();
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get("/tenant/dashboard/stats", {
        validateStatus: () => true,
      });
      const bookingsRes = await api.get("/bookings/tenant", {
        validateStatus: () => true,
      });
 
      const rawBookings = bookingsRes.status === 200 ? bookingsRes.data : null;
      let bookingsArray: RecentBooking[] = [];
      if (Array.isArray(rawBookings)) {
        bookingsArray = rawBookings;
      } else if (rawBookings?.data && Array.isArray(rawBookings.data)) {
        bookingsArray = rawBookings.data;
      } else if (rawBookings?.bookings && Array.isArray(rawBookings.bookings)) {
        bookingsArray = rawBookings.bookings;
      } else {
        const possible = Object.values(rawBookings || {}).find((v) =>
          Array.isArray(v)
        );
        if (Array.isArray(possible)) bookingsArray = possible as RecentBooking[];
      }
      setRecentBookings(bookingsArray.slice(0, 5));
 
      if (statsRes.status === 200) {
        setStats(statsRes.data);
      } else {
        let totalProperties = 0;
        try {
          const propsRes = await api.get("/tenant/properties", {
            validateStatus: () => true,
          });
          if (propsRes.status === 200) {
            const raw = propsRes.data;
            if (Array.isArray(raw)) {
              totalProperties = raw.length;
            } else if (Array.isArray(raw?.data)) {
              totalProperties = raw.data.length;
            } else if (typeof raw?.meta?.total === "number") {
              totalProperties = raw.meta.total;
            }
          }
        } catch {}
 
        const totalBookings = bookingsArray.length;
        const revenue = bookingsArray.reduce((sum, b: any) => {
          const val = Number(b.totalPrice ?? 0);
          return sum + (isFinite(val) ? val : 0);
        }, 0);
        setStats({ totalProperties, totalBookings, revenue });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}! 👋</p>
        </div>

        {/* ---- STATS ---- */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Properties */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Properties</span>
                <span className="text-2xl">🏠</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalProperties}
              </div>
            </div>

            {/* Bookings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Bookings</span>
                <span className="text-2xl">📘</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalBookings}
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 text-sm">Total Revenue</span>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.revenue)}
              </div>
            </div>
          </div>
        )}

        {/* ---- QUICK ACTIONS ---- */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <a
            href="/dashboard/properties/new"
            className="bg-blue-600 text-white rounded-lg shadow p-6 hover:bg-blue-700 transition text-center"
          >
            <div className="text-4xl mb-3">➕</div>
            <div className="text-lg font-semibold">Add New Property</div>
          </a>
          <a
            href="/dashboard/bookings"
            className="bg-green-600 text-white rounded-lg shadow p-6 hover:bg-green-700 transition text-center"
          >
            <div className="text-4xl mb-3">📋</div>
            <div className="text-lg font-semibold">Manage Bookings</div>
          </a>
          <a
            href="/dashboard/reports"
            className="bg-purple-600 text-white rounded-lg shadow p-6 hover:bg-purple-700 transition text-center"
          >
            <div className="text-4xl mb-3">📊</div>
            <div className="text-lg font-semibold">View Reports</div>
          </a>
        </div>

        {/* ---- RECENT BOOKINGS ---- */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Recent Bookings</h2>
              <a
                href="/dashboard/bookings"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </a>
            </div>
          </div>

          {recentBookings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p>No recent bookings</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booked At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">

                      {/* Guest */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">
                          {booking.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.user.email}
                        </div>
                      </td>

                      {/* Property */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {booking.property.name}
                        </div>
                      </td>

                      {/* Created date */}
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4 text-sm font-semibold">
                        {formatCurrency(booking.totalPrice || 0)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-sm">
                        <a
                          href={`/dashboard/bookings/${booking.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </a>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
