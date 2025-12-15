"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Property } from "@/types";
import PropertyForm from "@/components/tenant/PropertyForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();

  
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, [params.id]);

  const fetchProperty = async () => {
    try {
      const response = await api.get(`/tenant/properties/${params.id}`);
      setProperty(response.data);
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Property not found");
      router.push("/dashboard/properties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      const payload = {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        categoryId: data.categoryId || null,
        facilityIds: Array.isArray(data.facilityIds) ? data.facilityIds : [],
      };
      await api.put(`/properties/${params.id}`, payload);
      toast.success("Property updated successfully!");
      router.push("/dashboard/properties");
    } catch (error: any) {
      console.error("Error updating property:", error);
      const message =
        error.response?.data?.message || "Failed to update property";
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

  if (!property) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Property</h1>
        <p className="text-gray-600">Update your property details</p>
      </div>

      <PropertyForm
        property={property}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Room Management Section */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Rooms ({property.rooms.length})
          </h2>
          <a
            href={`/dashboard/properties/${params.id}/rooms/new`}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            + Add Room
          </a>
        </div>

        {property.rooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🛏️</div>
            <p>No rooms yet. Add your first room!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {property.rooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between border rounded-lg p-4"
              >
                <div>
                  <h3 className="font-semibold">{room.name}</h3>
                  <p className="text-sm text-gray-600">
                    {room.beds} beds • {room.baths} baths •{" "}
                    {room.capacityGuests} guests
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(room.basePrice)}/night
                  </span>
                  <a
                    href={`/dashboard/properties/${params.id}/rooms/${room.id}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Edit
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
