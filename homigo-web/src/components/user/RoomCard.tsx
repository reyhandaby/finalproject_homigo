import Image from "next/image";
import Link from "next/link";
import { Room } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface RoomCardProps {
  room: Room;
  propertyId: string;
}

export default function RoomCard({ room, propertyId }: RoomCardProps) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition">
      <div className="grid md:grid-cols-5 gap-4">
        <div className="md:col-span-2 relative h-48 bg-gray-200">
          {room.images[0] ? (
            <Image
              src={room.images[0].url}
              alt={room.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <span className="text-4xl">🛏️</span>
            </div>
          )}
        </div>

        <div className="md:col-span-3 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">{room.name}</h3>

            {room.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {room.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-3">
              <div className="flex items-center">
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {room.capacityGuests} Guests
              </div>
              <div className="flex items-center">
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                {room.beds} Beds
              </div>
              <div className="flex items-center">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {room.baths} Baths
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(room.basePrice)}
              </div>
              <div className="text-xs text-gray-500">per night</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
