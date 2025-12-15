// properties/[id]/rooms/[roomid]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Room } from "@/types";
import RoomForm from "@/components/tenant/RoomForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { api, roomsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { sanitizeRoomPayload } from "@/lib/utils";

export default function EditRoomPage() {
  const params = useParams();
  const router = useRouter();

  const propertyId = params.id as string;
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // --- Helpers using validateStatus to avoid axios rejection / interceptor error logs ---
  async function tryGet(endpoints: string[]) {
    for (const ep of endpoints) {
      // validateStatus true so axios won't reject (and interceptor won't print)
      const res = await api.request({
        method: "get",
        url: ep,
        validateStatus: () => true,
      });

      if (res.status === 200) {
        console.log("GET success:", ep);
        return { data: res.data, endpoint: ep };
      }

      // optional: only log debug-level message (not console.error)
      console.log(`GET ${res.status} for ${ep}, trying next if any`);
    }
    const e: any = new Error("Not found on any endpoint");
    e.status = 404;
    throw e;
  }

  async function tryMethod(
    method: "put" | "delete" | "post",
    endpoints: string[],
    payload?: any
  ) {
    for (const ep of endpoints) {
      const res = await api.request({
        method,
        url: ep,
        data: payload,
        validateStatus: () => true,
      });

      // treat 200 / 201 / 204 as success
      if (res.status >= 200 && res.status < 300) {
        console.log(`${method.toUpperCase()} success:`, ep);
        return { data: res.data, endpoint: ep };
      }

      console.log(`${method.toUpperCase()} ${res.status} for ${ep}, trying next if any`);
    }
    const e: any = new Error(`${method.toUpperCase()} failed on all endpoints`);
    e.status = 404;
    throw e;
  }

  const fetchRoom = async () => {
    setIsLoading(true);
    try {
      // urutkan kemungkinan endpoint sesuai backend mounting yang mungkin kamu pakai
      const endpoints = [
        `/rooms/${roomId}`, // preferred
        `/tenant/rooms/${roomId}`,
        `/${roomId}`, // fallback if router mounted at root
      ];

      const result = await tryGet(endpoints);
      setRoom(result.data);
    } catch (error: any) {
      console.error("Error fetching room (all endpoints):", error);
      toast.error("Room not found");
      router.push(`/dashboard/properties/${propertyId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
  setIsSubmitting(true);

  try {
    const payload = sanitizeRoomPayload(data);

    // Validasi singkat
    if (!payload.name) {
      toast.error("Nama kamar wajib diisi");
      return;
    }
    if (payload.basePrice === null || payload.basePrice <= 0) {
      toast.error("Base price harus berupa angka positif");
      return;
    }
    if (
      payload.capacityGuests === null ||
      !Number.isInteger(payload.capacityGuests) ||
      payload.capacityGuests < 1
    ) {
      toast.error("Capacity harus berupa integer >= 1");
      return;
    }

    // PENTING: panggil roomsApi.update yang benar
    await roomsApi.update(roomId, payload);

    toast.success("Room updated successfully!");
    router.push(`/dashboard/properties/${propertyId}`);
  } catch (err: any) {
    console.error("Error updating room:", err);
    toast.error(
      err?.response?.data?.message ||
      (err?.response?.data?.errors && JSON.stringify(err.response.data.errors)) ||
      "Gagal menyimpan kamar"
    );
  } finally {
    setIsSubmitting(false);
  }
};

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const endpoints = [
        `/rooms/${roomId}`,
        `/tenant/rooms/${roomId}`,
        `/${roomId}`,
      ];
      await tryMethod("delete", endpoints);
      toast.success("Room deleted successfully!");
      router.push(`/dashboard/properties/${propertyId}`);
    } catch (error: any) {
      console.error("Error deleting room:", error);
      const message = error.response?.data?.message || "Failed to delete room";
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

  if (!room) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <a
          href={`/dashboard/properties/${propertyId}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 inline-block"
        >
          ← Back to Property
        </a>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Room</h1>
            <p className="text-gray-600">Update room details</p>
          </div>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
          >
            Delete Room
          </button>
        </div>
      </div>

      <RoomForm
        room={room}
        propertyId={propertyId}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
