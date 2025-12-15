"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Booking } from "@/types";
import { bookingsApi } from "@/lib/api";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getBookingStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/utils";
import { useAuth } from "@/app/providers";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toast from "react-hot-toast";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchBookingDetail();
    }
  }, [user, params.id]);

  const fetchBookingDetail = async () => {
    try {
      const response = await bookingsApi.detail(params.id as string);
      setBooking(response.data);
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error("Booking not found");
      router.push("/bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("File must be jpg, png, or webp");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setPaymentFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPayment = async () => {
    if (!paymentFile || !paymentPreview) {
      toast.error("Please select a payment proof image");
      return;
    }

    setIsUploading(true);

    try {
      const form = new FormData();
      form.append("paymentProof", paymentFile);
      await bookingsApi.uploadPaymentProof(params.id as string, form);
      toast.success("Payment proof uploaded successfully!");
      fetchBookingDetail();
      setPaymentFile(null);
      setPaymentPreview("");
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to upload payment proof";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    setIsCancelling(true);

    try {
      await bookingsApi.cancel(params.id as string);
      toast.success("Booking cancelled successfully");
      fetchBookingDetail();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to cancel booking";
      toast.error(message);
    } finally {
      setIsCancelling(false);
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

  const canUploadPayment =
    booking.status === "PENDING" && booking.paymentStatus === "PENDING";
  const canCancel = ["PENDING", "WAITING_CONFIRMATION"].includes(
    booking.status
  );
  const canReview = booking.status === "COMPLETED" && !booking.review;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">
            Home
          </a>
          <span className="mx-2">›</span>
          <a href="/bookings" className="hover:text-blue-600">
            My Bookings
          </a>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Booking Details</span>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Booking Details</h1>
              <p className="text-sm text-gray-600">Booking ID: {booking.id}</p>
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
          <h2 className="text-xl font-semibold mb-4">Property Information</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative h-48 rounded-lg overflow-hidden">
              {booking.property.images[0] ? (
                <Image
                  src={booking.property.images[0].url}
                  alt={booking.property.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400">
                  <span className="text-4xl">🏠</span>
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold mb-2">
                {booking.property.name}
              </h3>
              <p className="text-gray-600 mb-2 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {booking.property.city}
              </p>
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

        {canUploadPayment && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Upload Payment Proof</h2>
            <p className="text-gray-600 mb-4">
              Please upload your payment proof to continue with the booking
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Proof Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {paymentPreview && (
                <div className="relative h-64 rounded-lg overflow-hidden border">
                  <Image
                    src={paymentPreview}
                    alt="Payment proof preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <button
                onClick={handleUploadPayment}
                disabled={!paymentFile || isUploading}
                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isUploading ? "Uploading..." : "Upload Payment Proof"}
              </button>
            </div>
          </div>
        )}

        {booking.paymentProof && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Proof</h2>
            <div className="relative h-64 rounded-lg overflow-hidden border">
              <Image
                src={booking.paymentProof.imageUrl}
                alt="Payment proof"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Uploaded at: {formatDateTime(booking.paymentProof.uploadedAt)}
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-4">
            {canCancel && (
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {isCancelling ? "Cancelling..." : "Cancel Booking"}
              </button>
            )}

            {canReview && (
              <a
                href={`/review/${booking.id}`}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Write Review
              </a>
            )}

            <a
              href="/bookings"
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Back to Bookings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
