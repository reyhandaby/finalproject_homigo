"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PropertyForm from "@/components/tenant/PropertyForm";
import { propertiesApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function NewPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      await propertiesApi.create(data);

      toast.success("Property created successfully!");
      router.push("/dashboard/properties");
    } catch (error: any) {
      console.error("Error creating property:", error);
      const message =
        error.response?.data?.message || "Failed to create property";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add New Property</h1>
        <p className="text-gray-600">
          Fill in the details to create a new property listing
        </p>
      </div>

      <PropertyForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
