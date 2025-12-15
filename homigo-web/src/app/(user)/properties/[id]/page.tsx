"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Property } from "@/types";
import { propertiesApi, bookingsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/app/providers";
import ImageGallery from "@/components/shared/ImageGallery";
import RoomCard from "@/components/user/RoomCard";
import DatePicker from "@/components/shared/DatePicker";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toast from "react-hot-toast";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(
    searchParams.get("roomId") || ""
  );
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchPropertyDetail();
  }, [params.id]);

  const fetchPropertyDetail = async () => {
    try {
      const id = params.id as string;
      const response = await propertiesApi.detail(id);
      setProperty(response.data);
    } catch (error: any) {
      console.error("Error fetching property:", error);
      toast.error("Property not found");
      router.push("/properties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      toast.error("Please login to book");
      router.push(`/login?redirect=/properties/${params.id}`);
      return;
    }

    if (!selectedRoomId) {
      toast.error("Please select a room");
      return;
    }

    if (!checkInDate || !checkOutDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (isNaN(checkIn.getTime())) {
      toast.error("Invalid check-in date");
      return;
    }

    if (isNaN(checkOut.getTime())) {
      toast.error("Invalid check-out date");
      return;
    }

    if (checkOut <= checkIn) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    setIsBooking(true);

    try {
      const checkInISO = checkIn.toISOString();
      const checkOutISO = checkOut.toISOString();

      const bookingData = {
        roomId: selectedRoomId,
        propertyId: property!.id,
        checkInDate: checkInISO,
        checkOutDate: checkOutISO,
        guests: Number(guests),
      };

      console.log("📤 Full booking data:", bookingData);
      console.log("📤 Data types:", {
        roomId: typeof bookingData.roomId,
        propertyId: typeof bookingData.propertyId,
        checkInDate: typeof bookingData.checkInDate,
        checkOutDate: typeof bookingData.checkOutDate,
        guests: typeof bookingData.guests,
      });

      const response = await bookingsApi.create(bookingData);

      console.log("✅ Booking response:", response.data);

      toast.success("Booking created successfully!");
      router.push(`/bookings/${response.data.booking.id}`);
    } catch (error: any) {
      console.error("❌ Booking error:", error);
      console.error("❌ Response:", error.response);
      console.error("❌ Data:", error.response?.data);

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Booking failed";

      toast.error(message);
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!property) {
    return null;
  }

  const selectedRoom = property.rooms.find((r) => r.id === selectedRoomId);

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();
  const totalPrice = selectedRoom ? selectedRoom.basePrice * nights : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4 text-sm text-gray-600">
          <a href="/" className="hover:text-blue-600">
            Home
          </a>
          <span className="mx-2">›</span>
          <a href="/properties" className="hover:text-blue-600">
            Properties
          </a>
          <span className="mx-2">›</span>
          <span className="text-gray-900">{property.name}</span>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{property.name}</h1>
          <div className="flex items-center text-gray-600">
            <svg
              className="w-5 h-5 mr-1"
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
            <span>{property.city}</span>
            {property.category && (
              <>
                <span className="mx-2">•</span>
                <span>{property.category.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="mb-8">
          <ImageGallery images={property.images} propertyName={property.name} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {property.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  About This Property
                </h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            {property.address && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Location</h2>
                <p className="text-gray-700">{property.address}</p>
              </div>
            )}

            {property.facilities && property.facilities.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Facilities</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {property.facilities.map((facility) => (
                    <div
                      key={facility.id}
                      className="flex items-center text-gray-700"
                    >
                      <svg
                        className="w-5 h-5 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {facility.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-semibold mb-4">Available Rooms</h2>
              {property.rooms && property.rooms.length > 0 ? (
                <div className="space-y-4">
                  {property.rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      propertyId={property.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No rooms available
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h3 className="text-xl font-semibold mb-4">Book Your Stay</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Room *
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a room</option>
                    {property.rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} - {formatCurrency(room.basePrice)}/night
                      </option>
                    ))}
                  </select>
                </div>

                <DatePicker
                  label="Check-in *"
                  value={checkInDate}
                  onChange={setCheckInDate}
                />

                <DatePicker
                  label="Check-out *"
                  value={checkOutDate}
                  onChange={setCheckOutDate}
                  min={checkInDate || new Date().toISOString().split("T")[0]}
                  disabled={!checkInDate}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <input
                    type="number"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                    min={1}
                    max={selectedRoom?.capacityGuests || 10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {selectedRoom && guests > selectedRoom.capacityGuests && (
                    <p className="text-red-600 text-sm mt-1">
                      Maximum capacity: {selectedRoom.capacityGuests} guests
                    </p>
                  )}
                </div>

                {selectedRoom && checkInDate && checkOutDate && nights > 0 && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Base Price</span>
                      <span>{formatCurrency(selectedRoom.basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Nights</span>
                      <span>{nights}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="text-blue-600">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={
                    !selectedRoomId ||
                    !checkInDate ||
                    !checkOutDate ||
                    nights === 0 ||
                    (selectedRoom && guests > selectedRoom.capacityGuests) ||
                    isBooking
                  }
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isBooking ? "Processing..." : "Book Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
