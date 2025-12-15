// tenant/dashboard/properties/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Property } from "@/types";
import api from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import toast from "react-hot-toast";

export default function TenantPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setIsLoading(true);
    try {
      const resp = await api.get("/tenant/properties");
      // debug: lihat payload persis di console
      console.log("[DEBUG] GET /tenant/properties ->", resp);
      const payload = resp.data;

      // handle beberapa kemungkinan shape:
      // 1) { data: [...] , meta: {...} }
      // 2) { items: [...] , ... }
      // 3) [...]  (direct array)
      // 4) { properties: [...] }
      let items: Property[] = [];

      if (Array.isArray(payload)) {
        items = payload as Property[];
      } else if (Array.isArray(payload.data)) {
        items = payload.data as Property[];
      } else if (Array.isArray(payload.items)) {
        items = payload.items as Property[];
      } else if (Array.isArray(payload.properties)) {
        items = payload.properties as Property[];
      } else if (Array.isArray(payload.data?.items)) {
        items = payload.data.items as Property[];
      } else {
        // fallback: try to dig deeper
        const maybe = payload.data || payload.items || payload.properties || [];
        if (Array.isArray(maybe)) items = maybe as Property[];
      }

      setProperties(items || []);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      toast.error("Failed to load properties");
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      // NOTE: backend delete route is DELETE /properties/:id (not /tenant/properties/:id)
      await api.delete(`/properties/${id}`);
      toast.success("Property deleted successfully");
      // refresh
      fetchProperties();
    } catch (error: any) {
      console.error("Error deleting property:", error);
      const message =
        error.response?.data?.message || "Failed to delete property";
      toast.error(message);
    }
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Properties</h1>
          <p className="text-gray-600">Manage your property listings</p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          + Add Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first property
          </p>
          <Link
            href="/dashboard/properties/new"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Add Property
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="relative h-48 bg-gray-200">
                {property.images && property.images.length > 0 && property.images[0].url ? (
                  <Image
                    src={property.images[0].url}
                    alt={property.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <span className="text-4xl">🏠</span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1 line-clamp-1">
                  {property.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{property.city}</p>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">
                    {Array.isArray(property.rooms) ? property.rooms.length : 0} rooms
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(
    property.rooms && property.rooms.length > 0
      ? Math.min(...property.rooms.map(r => Number(r.basePrice)))
      : 0
  )}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/properties/${property.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit dan kelola room
                  </Link>
                  <button
                    onClick={() => handleDelete(property.id, property.name)}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
