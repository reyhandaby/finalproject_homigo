"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ReportData {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  monthlyRevenue: { month: string; revenue: number }[];
  topProperties: {
    id: string;
    name: string;
    revenue: number;
    bookings: number;
  }[];
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const parseNumber = (v: any) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    // if prisma Decimal object, it might have toString()
    if (typeof v === "object" && typeof v.toString === "function")
      return Number(v.toString());
    return Number(v) || 0;
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/reports/tenant/summary", { params: { startDate: dateRange.startDate, endDate: dateRange.endDate } });

      const d = response?.data ?? {};

      // Normalize/compatibility layer: support many backend shapes
      // totalRevenue: could be number or string or d.totalRevenue
      const totalRevenue = parseNumber(
        d.totalRevenue ?? d.totalRevenueString ?? d.revenue ?? 0
      );

      const totalBookings = Number(
        d.totalBookings ?? d.totalBookingCount ?? d.total ?? 0
      );

      const completedBookings = Number(
        d.completedBookings ?? d.confirmedBookings ?? 0
      );

      const cancelledBookings = Number(
        d.cancelledBookings ?? d.cancelled ?? 0
      );

      // monthlyRevenue: prefer d.monthlyRevenue, else d.revenueByMonth, else d.revenueByMonthComputed
      const rawMonthly =
        d.monthlyRevenue ?? d.revenueByMonth ?? d.monthly ?? [];

      const monthlyRevenue: { month: string; revenue: number }[] =
        Array.isArray(rawMonthly)
          ? rawMonthly.map((it: any) => {
              // support shapes like { month: '2025-12', revenue: '123.45' } or { label: 'Dec', value: 123 }
              const month =
                it.month ?? it.label ?? it.name ?? String(it[0] ?? "");
              const revenue =
                parseNumber(it.revenue ?? it.value ?? it.amount ?? it._sum?.totalPrice);
              return { month, revenue };
            })
          : [];

      // topProperties: prefer d.topProperties else d.bookingsByProperty / bookingsByProperty
      const rawTop =
        d.topProperties ?? d.bookingsByProperty ?? d.bookingsByProperty ?? [];

      const topProperties =
        Array.isArray(rawTop)
          ? rawTop.map((p: any) => {
              return {
                id: p.id ?? p.propertyId ?? p.property?.id ?? String(p[0] ?? ""),
                name: p.name ?? p.propertyName ?? p.property?.name ?? "Unknown",
                revenue: parseNumber(p.revenue ?? p._sum?.totalPrice ?? p.total ?? p.amount),
                bookings: Number(p.bookings ?? p.count ?? p._count?.id ?? 0),
              };
            })
          : [];

      const normalized: ReportData = {
        totalRevenue,
        totalBookings,
        completedBookings,
        cancelledBookings,
        monthlyRevenue,
        topProperties,
      };

      setReportData(normalized);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load reports");
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sales Reports</h1>
        <p className="text-gray-600">
          View your property performance and revenue
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Date Range</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {reportData ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(reportData.totalRevenue)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Total Bookings</div>
              <div className="text-2xl font-bold text-blue-600">
                {reportData.totalBookings}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Completed</div>
              <div className="text-2xl font-bold text-purple-600">
                {reportData.completedBookings}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-2">Cancelled</div>
              <div className="text-2xl font-bold text-red-600">
                {reportData.cancelledBookings}
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Monthly Revenue</h2>
            <div className="space-y-3">
              {reportData.monthlyRevenue.length === 0 ? (
                <p>Tidak ada data monthly.</p>
              ) : (
                reportData.monthlyRevenue.map((item) => (
                  <div
                    key={item.month}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{item.month}</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Properties */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Top Properties</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Property Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reportData.topProperties.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-sm text-gray-500">
                        Tidak ada properti.
                      </td>
                    </tr>
                  ) : (
                    reportData.topProperties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {property.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {property.bookings}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                          {formatCurrency(property.revenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">Tidak ada data laporan.</p>
        </div>
      )}
    </div>
  );
}
