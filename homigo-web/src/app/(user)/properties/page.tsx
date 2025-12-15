import { Suspense } from "react";
import PropertiesClient from "./PropertiesClient";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </div>
      }
    >
      <PropertiesClient />
    </Suspense>
  );
}
