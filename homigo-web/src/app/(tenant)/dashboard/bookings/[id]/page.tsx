"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Booking } from "@/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getBookingStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function TenantBookingDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchBookingDetail();
  }, [params.id]);

  const fetchBookingDetail = async () => {
  setIsLoading(true);
  try {
    const response = await api.get(`/bookings/${params.id}`);
    setBooking(response.data);
  } catch (error: any) {
    // logging yang lebih informatif
    console.error("Error fetching booking:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    const status = error.response?.status;
    if (status === 404) {
      toast.error("Booking tidak ditemukan");
      router.push("/dashboard/bookings");
    } else if (status === 403) {
      toast.error("Anda tidak berwenang melihat booking ini");
      router.push("/dashboard/bookings");
    } else {
      toast.error("Gagal mengambil data booking");
    }
  } finally {
    setIsLoading(false);
  }
};


  const handleApprovePayment = async () => {
  if (!confirm("Are you sure you want to approve this payment?")) return;
  setIsProcessing(true);
  try {
    // backend memiliki route POST /bookings/:id/approve (lihat action.ts)
    await api.post(`/bookings/${params.id}/approve`);
    toast.success("Payment approved successfully!");
    fetchBookingDetail();
  } catch (error: any) {
    console.error("Approve payment error:", error.response?.data || error);
    const message = error.response?.data?.message || "Failed to approve payment";
    toast.error(message);
  } finally {
    setIsProcessing(false);
  }
};

  const handleRejectPayment = async () => {
  const reason = prompt("Please enter rejection reason:");
  if (!reason) return;
  setIsProcessing(true);
  try {
    // backend memiliki route POST /bookings/:id/reject (lihat action.ts)
    await api.post(`/bookings/${params.id}/reject`, { reason });
    toast.success("Payment rejected");
    fetchBookingDetail();
  } catch (error: any) {
    console.error("Reject payment error:", error.response?.data || error);
    const message = error.response?.data?.message || "Failed to reject payment";
    toast.error(message);
  } finally {
    setIsProcessing(false);
  }
};

  const handleConfirmBooking = async () => {
  if (!confirm("Confirm this booking?")) return;
  setIsProcessing(true);
  try {
    // backend mungkin menggunakan POST /bookings/:id/approve to confirm (action.ts sets status CONFIRMED)
    // jika backend punya PUT /bookings/:id/confirm, gunakan itu. saya sarankan cek Network jika error.
    await api.post(`/bookings/${params.id}/approve`);
    toast.success("Booking confirmed!");
    fetchBookingDetail();
  } catch (error: any) {
    console.error("Confirm booking error:", error.response?.data || error);
    const message = error.response?.data?.message || "Failed to confirm booking";
    toast.error(message);
  } finally {
    setIsProcessing(false);
  }
};

  const handleRejectBooking = async () => {
  const reason = prompt("Please enter rejection reason:");
  if (!reason) return;
  setIsProcessing(true);
  try {
    // use same /bookings/:id/reject — backend handler sets paymentStatus to REJECTED
    await api.post(`/bookings/${params.id}/reject`, { reason });
    toast.success("Booking rejected");
    fetchBookingDetail();
  } catch (error: any) {
    console.error("Reject booking error:", error.response?.data || error);
    const message = error.response?.data?.message || "Failed to reject booking";
    toast.error(message);
  } finally {
    setIsProcessing(false);
  }
};

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

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

  const canApprovePayment =
    booking.paymentStatus === "WAITING_CONFIRMATION" && booking.paymentProof;
  const canConfirmBooking =
    booking.status === "WAITING_CONFIRMATION" &&
    booking.paymentStatus === "APPROVED";
  const canReject = ["PENDING", "WAITING_CONFIRMATION"].includes(
    booking.status
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4 text-sm text-gray-600">
        <a href="/dashboard" className="hover:text-blue-600">
          Dashboard
        </a>
        <span className="mx-2">›</span>
        <a href="/dashboard/bookings" className="hover:text-blue-600">
          Bookings
        </a>
        <span className="mx-2">›</span>
        <span className="text-gray-900">Booking Details</span>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Booking Details</h1>
            <p className="text-sm text-gray-600">ID: {booking.id}</p>
          </div>
          <div className="flex flex-col gap-2">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                booking.status
              )}`}
            >
              {getBookingStatusLabel(booking.status)}
            </span>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                booking.paymentStatus
              )}`}
            >
              {getPaymentStatusLabel(booking.paymentStatus)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Guest Information</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Name</span>
            <span className="font-medium">{booking.user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email</span>
            <span className="font-medium">{booking.user?.email}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Property & Room</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="relative h-32 rounded-lg overflow-hidden">
            {booking.property.images[0] ? (
              <Image
                src={booking.property.images[0].url}
                alt={booking.property.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400">
                🏠
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-1">
              {booking.property.name}
            </h3>
            <p className="text-gray-600 mb-2">{booking.property.city}</p>
            <p className="text-gray-700 font-medium">
              Room: {booking.room.name}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Check-in Date</p>
            <p className="font-semibold text-lg">
              {formatDate(booking.checkInDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Check-out Date</p>
            <p className="font-semibold text-lg">
              {formatDate(booking.checkOutDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Number of Guests</p>
            <p className="font-semibold text-lg">{booking.guests} people</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Nightly Price</p>
            <p className="font-semibold text-lg">
              {formatCurrency(booking.nightlyPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Booking Date</p>
            <p className="font-semibold">{formatDateTime(booking.createdAt)}</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center">
            <span className="text-xl font-semibold">Total Price</span>
            <span className="text-3xl font-bold text-blue-600">
              {formatCurrency(booking.totalPrice)}
            </span>
          </div>
        </div>
      </div>

      {booking.paymentProof && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Proof</h2>
          <div className="relative h-96 rounded-lg overflow-hidden border mb-3">
            <Image
              src={booking.paymentProof.imageUrl}
              alt="Payment proof"
              fill
              className="object-contain"
            />
          </div>
          <p className="text-sm text-gray-600">
            Uploaded at: {formatDateTime(booking.paymentProof.uploadedAt)}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {canApprovePayment && (
            <>
              <button
                onClick={handleApprovePayment}
                disabled={isProcessing}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                ✓ Approve Payment
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={isProcessing}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                ✗ Reject Payment
              </button>
            </>
          )}

          {canConfirmBooking && (
            <>
              <button
                onClick={handleConfirmBooking}
                disabled={isProcessing}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                ✓ Confirm Booking
              </button>
              <button
                onClick={handleRejectBooking}
                disabled={isProcessing}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                ✗ Reject Booking
              </button>
            </>
          )}

          <a
            href="/dashboard/bookings"
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Back to Bookings
          </a>
        </div>
      </div>
    </div>
  );
}
