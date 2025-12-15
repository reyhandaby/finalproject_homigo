import { Suspense } from "react";
import VerifyClient from "./VerifyClient";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">✉️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Email
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Check your inbox and click the verification link
            </p>
          </div>
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
