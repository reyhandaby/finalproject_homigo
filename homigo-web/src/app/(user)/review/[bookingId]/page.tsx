"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Booking } from "@/types";
import { bookingsApi, reviewsApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/app/providers";
import ReviewForm from "@/components/user/ReviewForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toast from "react-hot-toast";

export default function WriteReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBookingDetail();
    }
  }, [user, params.bookingId]);

  const fetchBookingDetail = async () => {
    try {
      const response = await bookingsApi.detail(params.bookingId as string);
      const bookingData = response.data;

      if (bookingData.status !== "COMPLETED") {
        toast.error("You can only review completed bookings");
        router.push("/bookings");
        return;
      }

      if (bookingData.review) {
        toast.error("You have already reviewed this booking");
        router.push(`/bookings/${bookingData.id}`);
        return;
      }

      setBooking(bookingData);
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error("Booking not found");
      router.push("/bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    setIsSubmitting(true);

    try {
      await reviewsApi.create({
        bookingId: params.bookingId as string,
        rating,
        comment: comment || undefined,
      });

      toast.success("Review submitted successfully!");
      router.push(`/bookings/${params.bookingId}`);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to submit review";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Write a Review</h1>
          <p className="text-gray-600">
            Share your experience with other travelers
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0">
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
            <div>
              <h3 className="text-xl font-semibold mb-1">
                {booking.property.name}
              </h3>
              <p className="text-gray-600 text-sm mb-2">{booking.room.name}</p>
              <p className="text-gray-500 text-sm">
                {formatDate(booking.checkInDate)} -{" "}
                {formatDate(booking.checkOutDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <ReviewForm
            bookingId={params.bookingId as string}
            onSubmit={handleSubmitReview}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
