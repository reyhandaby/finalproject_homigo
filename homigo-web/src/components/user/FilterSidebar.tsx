"use client";

import { useState, useEffect } from "react";
import { Category, Facility } from "@/types";
import { categoriesApi, facilitiesApi } from "@/lib/api";

interface FilterSidebarProps {
  onFilterChange: (filters: any) => void;
  currentFilters: any;
}

export default function FilterSidebar({
  onFilterChange,
  currentFilters,
}: FilterSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(
    currentFilters.categoryId || ""
  );
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
    currentFilters.facilityIds?.split(",").filter(Boolean) || []
  );
  const [priceRange, setPriceRange] = useState({
    min: currentFilters.minPrice || "",
    max: currentFilters.maxPrice || "",
  });

  useEffect(() => {
    fetchCategories();
    fetchFacilities();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.list();
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await facilitiesApi.list();
      setFacilities(response.data);
    } catch (error) {
      console.error("Error fetching facilities:", error);
    }
  };

  const handleFacilityToggle = (facilityId: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facilityId)
        ? prev.filter((id) => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  const handleApplyFilters = () => {
    onFilterChange({
      categoryId: selectedCategory,
      facilityIds: selectedFacilities.join(","),
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
    });
  };

  const handleResetFilters = () => {
    setSelectedCategory("");
    setSelectedFacilities([]);
    setPriceRange({ min: "", max: "" });
    onFilterChange({
      categoryId: "",
      facilityIds: "",
      minPrice: "",
      maxPrice: "",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Filters</h3>
        <button
          onClick={handleResetFilters}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Reset
        </button>
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-3">Category</h4>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-3">Price Range (per night)</h4>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Min price"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange({ ...priceRange, min: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Max price"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange({ ...priceRange, max: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-medium mb-3">Facilities</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {facilities.map((facility) => (
            <label
              key={facility.id}
              className="flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedFacilities.includes(facility.id)}
                onChange={() => handleFacilityToggle(facility.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {facility.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleApplyFilters}
        className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
      >
        Apply Filters
      </button>
    </div>
  );
}
