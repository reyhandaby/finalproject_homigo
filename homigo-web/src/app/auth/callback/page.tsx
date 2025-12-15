import { Suspense } from "react";
import CallbackHandler from "./CallbackHandler";

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="p-6">Mengautentikasi...</div>}>
      <CallbackHandler />
    </Suspense>
  );
}
