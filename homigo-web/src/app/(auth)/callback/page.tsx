import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Authenticating...
            </h1>
            <p className="text-gray-600">Please wait while we sign you in</p>
          </div>
        </div>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
