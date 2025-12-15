import Link from "next/link";
import Image from "next/image";
import { Booking } from "@/types";
import {
  formatCurrency,
  formatDate,
  getBookingStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/utils";

interface BookingCardProps {
  booking: Booking;
}

export default function BookingCard({ booking }: BookingCardProps) {
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

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      WAITING_PAYMENT: "bg-orange-100 text-orange-800",
      WAITING_CONFIRMATION: "bg-blue-100 text-blue-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Link
      href={`/bookings/${booking.id}`}
      className="block bg-white border rounded-lg overflow-hidden hover:shadow-lg transition"
    >
      <div className="grid md:grid-cols-4 gap-4">
        <div className="md:col-span-1 relative h-48 bg-gray-200">
          {booking.property.images[0] ? (
            <Image
              src={booking.property.images[0].url}
              alt={booking.property.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <span className="text-4xl">🏠</span>
            </div>
          )}
        </div>

        <div className="md:col-span-3 p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-semibold mb-1">
                {booking.property.name}
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
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
                className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                  booking.paymentStatus
                )}`}
              >
                {getPaymentStatusLabel(booking.paymentStatus)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-sm text-gray-500">Room</p>
              <p className="font-medium">{booking.room.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Guests</p>
              <p className="font-medium">{booking.guests} people</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-in</p>
              <p className="font-medium">{formatDate(booking.checkInDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-out</p>
              <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(booking.totalPrice)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Booking ID</p>
              <p className="text-xs font-mono text-gray-700">
                {booking.id.slice(0, 12)}...
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
