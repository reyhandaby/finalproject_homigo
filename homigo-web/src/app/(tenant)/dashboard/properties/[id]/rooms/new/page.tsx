"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoomForm from "@/components/tenant/RoomForm";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function NewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const propertyId = params.id as string;

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      await api.post(`/tenant/properties/${propertyId}/rooms`, data);
      toast.success("Room created successfully!");
      router.push(`/dashboard/properties/${propertyId}`);
    } catch (error: any) {
      console.error("Error creating room:", error);
      const message = error.response?.data?.message || "Failed to create room";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <a
          href={`/dashboard/properties/${propertyId}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block"
        >
          ← Back to Property
        </a>
        <h1 className="text-3xl font-bold mb-2">Add New Room</h1>
        <p className="text-gray-600">Fill in the room details</p>
      </div>

      <RoomForm
        propertyId={propertyId}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
