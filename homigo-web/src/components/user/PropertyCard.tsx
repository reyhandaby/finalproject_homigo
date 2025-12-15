import Link from "next/link";
import Image from "next/image";
import { Property } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div className="relative h-48 bg-gray-200">
        {property.images[0] ? (
          <Image
            src={property.images[0].url}
            alt={property.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span className="text-4xl">🏠</span>
          </div>
        )}

        {property.category && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 text-xs font-medium bg-white text-gray-800 rounded shadow">
              {property.category.name}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition">
          {property.name}
        </h3>

        <p className="text-sm text-gray-600 mb-3 flex items-center">
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
          {property.city}
        </p>

        {property.facilities && property.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {property.facilities.slice(0, 3).map((facility) => (
              <span
                key={facility.id}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {facility.name}
              </span>
            ))}
            {property.facilities.length > 3 && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                +{property.facilities.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-baseline justify-between pt-3 border-t">
          <span className="text-sm text-gray-500">Starting from</span>
          <div className="text-right">
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(property.minPrice)}
            </span>
            <span className="text-xs text-gray-500 block">/ night</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
