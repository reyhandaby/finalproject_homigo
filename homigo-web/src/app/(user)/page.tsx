"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Property } from "@/types";
import { propertiesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProperties();
  }, []);

  const fetchFeaturedProperties = async () => {
    try {
      const response = await propertiesApi.list({
        pageSize: 6,
        sort: "price",
        order: "asc",
      });
      setFeaturedProperties(response.data.items);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect Stay
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Compare prices and book amazing properties across Indonesia
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/properties"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Explore Properties
            </Link>
            <Link
              href="/register?role=TENANT"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-blue-600 transition"
            >
              List Your Property
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">
                Best Price Guarantee
              </h3>
              <p className="text-gray-600">
                Dynamic pricing based on season and demand
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure Booking</h3>
              <p className="text-gray-600">Safe and verified payment process</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">Verified Reviews</h3>
              <p className="text-gray-600">Real reviews from real guests</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Properties</h2>
            <Link
              href="/properties"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All →
            </Link>
          </div>

          {isLoading ? (
            <LoadingSpinner size="lg" />
          ) : featuredProperties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No properties available</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.slug}`}
                  className="group border rounded-lg overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative h-48 bg-gray-200">
                    {property.images[0] ? (
                      <Image
                        src={property.images[0].url}
                        alt={property.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {property.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                      <span className="mr-1">📍</span>
                      {property.city}
                    </p>
                    {property.category && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded mb-2">
                        {property.category.name}
                      </span>
                    )}
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-sm text-gray-500">From</span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(property.minPrice)}
                        </span>
                        <span className="text-xs text-gray-500 block">
                          per night
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/properties"
              className="inline-block px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition"
            >
              View All Properties
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Own a Property?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of property owners earning with Homigo
          </p>
          <Link
            href="/register?role=TENANT"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Start Earning Today
          </Link>
        </div>
      </section>
    </div>
  );
}
