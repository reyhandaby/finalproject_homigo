"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Booking } from "@/types";
import {
  formatCurrency,
  formatDate,
  getBookingStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function TenantBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
  setIsLoading(true);
  try {
    // panggil endpoint yang benar untuk tenant
    const response = await api.get("/bookings/tenant");

    // debug: lihat bentuk response yang diterima
    console.log("DEBUG bookingsRes.data:", response.data);

    // normalisasi: backend bisa mengembalikan array langsung atau { data: [...] } atau { items: [...] }
    const raw = response.data;
    let arr: Booking[] = [];

    if (Array.isArray(raw)) {
      arr = raw;
    } else if (raw?.data && Array.isArray(raw.data)) {
      arr = raw.data;
    } else if (raw?.items && Array.isArray(raw.items)) {
      arr = raw.items;
    } else if (raw?.bookings && Array.isArray(raw.bookings)) {
      arr = raw.bookings;
    } else {
      // fallback: cari properti yang berupa array
      const possible = Object.values(raw || {}).find((v) => Array.isArray(v));
      if (Array.isArray(possible)) arr = possible as Booking[];
    }

    setBookings(arr);
  } catch (err: any) {
    console.error("Error fetching bookings:", err);
    // tampilkan pesan lebih spesifik kalau ada response body
    if (err?.response) {
      console.error("Bookings API response:", err.response.status, err.response.data);
    }
    toast.error("Failed to load bookings");
  } finally {
    setIsLoading(false);
  }
};

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    return booking.status === filter;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      WAITING_CONFIRMATION: "bg-blue-100 text-blue-800",
      CONFIRMED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
      COMPLETED: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
        <p className="text-gray-600">Manage all property bookings</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "PENDING"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Pending ({bookings.filter((b) => b.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("WAITING_CONFIRMATION")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "WAITING_CONFIRMATION"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Waiting (
            {bookings.filter((b) => b.status === "WAITING_CONFIRMATION").length}
            )
          </button>
          <button
            onClick={() => setFilter("CONFIRMED")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "CONFIRMED"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Confirmed ({bookings.filter((b) => b.status === "CONFIRMED").length}
            )
          </button>
          <button
            onClick={() => setFilter("CANCELLED")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "CANCELLED"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Cancelled ({bookings.filter((b) => b.status === "CANCELLED").length}
            )
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
          <p className="text-gray-600">
            {filter === "all"
              ? "You haven't received any bookings yet"
              : `No bookings with status: ${filter}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Property & Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">
                      {booking.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.user?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.property.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.room.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(booking.checkInDate)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(booking.totalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getBookingStatusLabel(booking.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/dashboard/bookings/${booking.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
