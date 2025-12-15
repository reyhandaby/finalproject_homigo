// components/tenant/PropertyForm.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Property, Category, Facility } from "@/types";
import api, { categoriesApi, facilitiesApi, seasonRatesApi } from "@/lib/api";
import toast from "react-hot-toast";
import { parseISO, format } from "date-fns";

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export default function PropertyForm({
  property,
  onSubmit,
  isSubmitting,
}: PropertyFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  const [formData, setFormData] = useState({
    name: property?.name || "",
    description: property?.description || "",
    address: property?.address || "",
    city: property?.city || "",
    categoryId: property?.category?.id || "",
    facilityIds: property?.facilities?.map((f) => f.id) || [],
  });

  const [images, setImages] = useState<string[]>(
    property?.images?.map((img) => img.url) || []
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  // Add-category UI state
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  // Add-facility UI state
  const [addingFacility, setAddingFacility] = useState(false);
  const [newFacilityName, setNewFacilityName] = useState("");
  const [isAddingFacility, setIsAddingFacility] = useState(false);

  // Season Rates state
  const [seasonRates, setSeasonRates] = useState<
    { id: string; type: "NOMINAL" | "PERCENTAGE"; value: number; startDate: string; endDate: string }[]
  >([]);
  const [newRate, setNewRate] = useState({
    type: "NOMINAL" as "NOMINAL" | "PERCENTAGE",
    value: 0,
    startDate: "",
    endDate: "",
  });
  const [isAddingRate, setIsAddingRate] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchFacilities();
    if (property?.id) {
      fetchSeasonRates();
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.list();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await facilitiesApi.list();
      setFacilities(response.data || []);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      toast.error("Failed to load facilities");
    }
  };

  const fetchSeasonRates = async () => {
    try {
      const resp = await seasonRatesApi.list({ propertyId: property!.id });
      setSeasonRates(
        (resp.data || []).map((r: any) => ({
          id: r.id,
          type: r.type,
          value: Number(r.value),
          startDate: r.startDate,
          endDate: r.endDate,
        }))
      );
    } catch (error) {
      console.error("Error fetching season rates:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const isOverlap = (
    startA: string,
    endA: string,
    startB: string,
    endB: string
  ) => {
    const aStart = parseISO(startA);
    const aEnd = parseISO(endA);
    const bStart = parseISO(startB);
    const bEnd = parseISO(endB);
    return aStart <= bEnd && aEnd >= bStart;
  };

  const handleAddSeasonRate = async () => {
    if (!property?.id) {
      return toast.error("Create property first before adding season rates");
    }
    if (!newRate.startDate || !newRate.endDate) {
      return toast.error("Start and end date are required");
    }
    if (parseISO(newRate.endDate) < parseISO(newRate.startDate)) {
      return toast.error("End date must be after start date");
    }
    const overlapped = seasonRates.some((r) =>
      isOverlap(newRate.startDate, newRate.endDate, r.startDate, r.endDate)
    );
    if (overlapped) {
      return toast.error("Season rate dates overlap with existing entries");
    }

    try {
      setIsAddingRate(true);
      const payload = {
        propertyId: property.id,
        type: newRate.type,
        value: Number(newRate.value),
        startDate: newRate.startDate,
        endDate: newRate.endDate,
      };
      const resp = await seasonRatesApi.create(payload);
      const created = resp.data;
      setSeasonRates((prev) => [
        ...prev,
        {
          id: created.id,
          type: created.type,
          value: Number(created.value),
          startDate: created.startDate,
          endDate: created.endDate,
        },
      ]);
      setNewRate({ type: "NOMINAL", value: 0, startDate: "", endDate: "" });
      toast.success("Season rate added");
    } catch (err: any) {
      console.error("Error adding season rate:", err);
      const msg = err.response?.data?.message || "Failed to add season rate";
      toast.error(msg);
    } finally {
      setIsAddingRate(false);
    }
  };

  const handleDeleteSeasonRate = async (id: string) => {
    try {
      await seasonRatesApi.delete(id);
      setSeasonRates((prev) => prev.filter((r) => r.id !== id));
      toast.success("Season rate deleted");
    } catch (err: any) {
      console.error("Error deleting season rate:", err);
      toast.error(err.response?.data?.message || "Failed to delete season rate");
    }
  };

  const handleFacilityToggle = (facilityId: string) => {
    setFormData({
      ...formData,
      facilityIds: formData.facilityIds.includes(facilityId)
        ? formData.facilityIds.filter((id) => id !== facilityId)
        : [...formData.facilityIds, facilityId],
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const invalidFiles = files.filter((file) => !file.type.startsWith("image/"));
    if (invalidFiles.length > 0) {
      toast.error("Please select only image files");
      return;
    }

    const largeFiles = files.filter((file) => file.size > 1 * 1024 * 1024);
    if (largeFiles.length > 0) {
      toast.error("Each image must be less than 1MB");
      return;
    }

    setNewImageFiles([...newImageFiles, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (index >= (property?.images?.length || 0)) {
      const newFileIndex = index - (property?.images?.length || 0);
      setNewImageFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
    }
  };

  // Add category (existing logic)
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Category name cannot be empty");
      return;
    }

    setIsAddingCategory(true);
    try {
      const res = await categoriesApi.create({ name });
      const created: Category = res.data;
      setCategories((prev) => {
        const exists = prev.find((c) => c.id === created.id);
        if (exists) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setFormData((prev) => ({ ...prev, categoryId: created.id }));
      setNewCategoryName("");
      setAddingCategory(false);
      toast.success("Category added");
    } catch (err: any) {
      console.error("Error creating category:", err);
      const msg = err.response?.data?.message || "Failed to create category";
      toast.error(msg);
    } finally {
      setIsAddingCategory(false);
    }
  };

  // NEW: Add facility (same pattern as category)
  const handleAddFacility = async () => {
    const name = newFacilityName.trim();
    if (!name) {
      toast.error("Facility name cannot be empty");
      return;
    }

    setIsAddingFacility(true);
    try {
      const res = await facilitiesApi.create({ name });
      const created: Facility = res.data;

      // add to facilities list (avoid duplicates) and auto-check it
      setFacilities((prev) => {
        const exists = prev.find((f) => f.id === created.id);
        if (exists) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });

      setFormData((prev) => ({
        ...prev,
        facilityIds: Array.from(new Set([...prev.facilityIds, created.id])),
      }));

      setNewFacilityName("");
      setAddingFacility(false);
      toast.success("Facility added");
    } catch (err: any) {
      console.error("Error creating facility:", err);
      const msg = err.response?.data?.message || "Failed to create facility";
      toast.error(msg);
    } finally {
      setIsAddingFacility(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Property name is required");
      return;
    }
    if (!formData.city.trim()) {
      toast.error("City is required");
      return;
    }
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    const submitData = {
      ...formData,
      images: images,
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Grand Hyatt Jakarta"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your property..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Jakarta"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Full address..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="flex items-center gap-2">
                {!addingCategory ? (
                  <button
                    type="button"
                    onClick={() => setAddingCategory(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    + Add category
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingCategory(false);
                      setNewCategoryName("");
                    }}
                    className="text-sm text-gray-600 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {addingCategory && (
              <div className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={isAddingCategory}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  {isAddingCategory ? "Adding..." : "Add"}
                </button>
              </div>
            )}

            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Facilities</h2>
          <div>
            {!addingFacility ? (
              <button
                type="button"
                onClick={() => setAddingFacility(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add facility
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAddingFacility(false);
                  setNewFacilityName("");
                }}
                className="text-sm text-gray-600 hover:underline"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {addingFacility && (
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newFacilityName}
              onChange={(e) => setNewFacilityName(e.target.value)}
              placeholder="New facility name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <button
              type="button"
              onClick={handleAddFacility}
              disabled={isAddingFacility}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {isAddingFacility ? "Adding..." : "Add"}
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {facilities.map((facility) => (
            <label
              key={facility.id}
              className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={formData.facilityIds.includes(facility.id)}
                onChange={() => handleFacilityToggle(facility.id)}
                className="mr-2"
              />
              <span className="text-sm">{facility.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Season Rates */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Season Rate / Peak Season</h2>
        </div>

        {!property?.id ? (
          <div className="text-sm text-gray-600">
            Create property first to add season rates.
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newRate.startDate}
                  onChange={(e) =>
                    setNewRate((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={newRate.endDate}
                  onChange={(e) =>
                    setNewRate((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Type
                </label>
                <select
                  value={newRate.type}
                  onChange={(e) =>
                    setNewRate((prev) => ({
                      ...prev,
                      type: e.target.value as "NOMINAL" | "PERCENTAGE",
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="NOMINAL">Nominal</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Value
                </label>
                <input
                  type="number"
                  value={newRate.value}
                  onChange={(e) =>
                    setNewRate((prev) => ({
                      ...prev,
                      value: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., 20 or 750000"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddSeasonRate}
                disabled={isAddingRate}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isAddingRate ? "Adding..." : "Add Season Rate"}
              </button>
            </div>

            <div className="mt-6">
              {seasonRates.length === 0 ? (
                <div className="text-sm text-gray-600">
                  No season rates yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {seasonRates.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="text-sm">
                        <div className="font-medium">
                          {r.type === "NOMINAL"
                            ? `Nominal: Rp ${Number(r.value).toLocaleString()}`
                            : `Percentage: ${Number(r.value)}%`}
                        </div>
                        <div className="text-gray-600">
                          {format(parseISO(r.startDate), "dd MMM yyyy")} -{" "}
                          {format(parseISO(r.endDate), "dd MMM yyyy")}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSeasonRate(r.id)}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Images *</h2>

        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="relative h-32 rounded-lg overflow-hidden border">
                  <Image
                    src={image}
                    alt={`Property image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition">
            <div className="text-4xl mb-2">📸</div>
            <div className="text-sm text-gray-600">
              Click to upload images (max 1MB each)
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <a
          href="/dashboard/properties"
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting
            ? "Saving..."
            : property
            ? "Update Property"
            : "Create Property"}
        </button>
      </div>
    </form>
  );
}
