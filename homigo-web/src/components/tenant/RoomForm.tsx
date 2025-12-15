"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { api, seasonRatesApi } from "@/lib/api";
import { parseISO, format } from "date-fns";

interface RoomFormProps {
  propertyId: string;
  room?: any;
  isSubmitting: boolean;
}

export default function RoomForm({ propertyId, room, isSubmitting }: RoomFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    beds: 1,
    baths: 1,
    capacityGuests: 2,
    basePrice: 0,
  });

  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
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

  /* ================= INIT EDIT ================= */
  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name ?? "",
        description: room.description ?? "",
        beds: Number(room.beds ?? 1),
        baths: Number(room.baths ?? 1),
        capacityGuests: Number(room.capacityGuests ?? 2),
        basePrice: Number(room.basePrice ?? 0),
      });

      setExistingImages(room.images ?? []);
      setPreviewImages(room.images?.map((i: any) => i.url) ?? []);
      fetchSeasonRates(room.id);
    }
  }, [room]);

  /* ================= INPUT ================= */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  /* ================= IMAGE UPLOAD ================= */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        return toast.error("File harus berupa gambar");
      }
      if (f.size > 1 * 1024 * 1024) {
        return toast.error("Ukuran gambar max 1MB");
      }
    }

    setNewImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setPreviewImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  /* ================= DELETE IMAGE ================= */
  const handleRemoveExistingImage = async (imageId: string) => {
    try {
      await api.delete(`/rooms/images/${imageId}`);
      setExistingImages((prev) => prev.filter((i) => i.id !== imageId));
      setPreviewImages((prev) =>
        prev.filter((_, idx) => existingImages[idx]?.id !== imageId)
      );
      toast.success("Image dihapus");
    } catch {
      toast.error("Gagal hapus image");
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) =>
      prev.filter((_, i) => i !== existingImages.length + index)
    );
  };
  const fetchSeasonRates = async (roomId: string) => {
    try {
      const resp = await seasonRatesApi.list({ roomId });
      setSeasonRates(
        (resp.data || []).map((r: any) => ({
          id: r.id,
          type: r.type,
          value: Number(r.value),
          startDate: r.startDate,
          endDate: r.endDate,
        }))
      );
    } catch (e) {}
  };
  const isOverlap = (
    aStart: string,
    aEnd: string,
    bStart: string,
    bEnd: string
  ) => {
    const s1 = parseISO(aStart);
    const e1 = parseISO(aEnd);
    const s2 = parseISO(bStart);
    const e2 = parseISO(bEnd);
    return s1 <= e2 && e1 >= s2;
  };
  const handleAddSeasonRate = async () => {
    if (!room?.id) return toast.error("Create room first");
    if (!newRate.startDate || !newRate.endDate) return toast.error("Start and end date are required");
    if (parseISO(newRate.endDate) < parseISO(newRate.startDate)) return toast.error("End date must be after start date");
    const overlapped = seasonRates.some((r) => isOverlap(newRate.startDate, newRate.endDate, r.startDate, r.endDate));
    if (overlapped) return toast.error("Season rate dates overlap");
    try {
      setIsAddingRate(true);
      const resp = await seasonRatesApi.create({
        roomId: room.id,
        type: newRate.type,
        value: Number(newRate.value),
        startDate: newRate.startDate,
        endDate: newRate.endDate,
      });
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
      toast.error(err.response?.data?.message || "Failed to add season rate");
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
      toast.error(err.response?.data?.message || "Failed to delete season rate");
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Nama kamar wajib");
    if (formData.basePrice <= 0) return toast.error("Harga tidak valid");
    if (previewImages.length === 0)
      return toast.error("Minimal 1 gambar");

    try {
      setSubmitting(true);

      let roomId = room?.id;

      const payload = {
        name: formData.name,
        description: formData.description,
        beds: Number(formData.beds),
        baths: Number(formData.baths),
        capacityGuests: Number(formData.capacityGuests),
        basePrice: Number(formData.basePrice), // 🔥 FIX UTAMA
      };

      if (!roomId) {
        const res = await api.post(
          `/tenant/properties/${propertyId}/rooms`,
          payload
        );
        roomId = res.data.id;
      } else {
        await api.put(`/rooms/${roomId}`, payload);
      }

      /* === UPLOAD IMAGES === */
      for (const file of newImageFiles) {
        const reader = new FileReader();
        await new Promise<void>((resolve, reject) => {
          reader.onload = async () => {
            try {
              await api.post(`/rooms/${roomId}/images`, {
                base64: reader.result,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      toast.success(room ? "Room updated!" : "Room created!");
      window.location.href = `/dashboard/properties/${propertyId}`;
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Gagal simpan room");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Room Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{room ? "Edit Room" : "Add Room"}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Room Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Deluxe Room" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the room features..." />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (per night) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">Rp</span>
                <input type="number" name="basePrice" value={formData.basePrice} onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="500000" min="0" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Guest Capacity *</label>
              <input type="number" name="capacityGuests" value={formData.capacityGuests} onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="2" min="1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Beds *</label>
              <input type="number" name="beds" value={formData.beds} onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1" min="1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Bathrooms *</label>
              <input type="number" name="baths" value={formData.baths} onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1" min="0" required />
            </div>
          </div>
        </div>
      </div>

      {/* Season Rates - only for existing room */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Season Rate / Peak Season</h2>
        {!room?.id ? (
          <div className="text-sm text-gray-600">Create the room first to add season rates.</div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={newRate.startDate}
                  onChange={(e) => setNewRate((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={newRate.endDate}
                  onChange={(e) => setNewRate((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate Type</label>
                <select
                  value={newRate.type}
                  onChange={(e) =>
                    setNewRate((prev) => ({ ...prev, type: e.target.value as "NOMINAL" | "PERCENTAGE" }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="NOMINAL">Nominal</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate Value</label>
                <input
                  type="number"
                  value={newRate.value}
                  onChange={(e) => setNewRate((prev) => ({ ...prev, value: Number(e.target.value) }))}
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
                <div className="text-sm text-gray-600">No season rates yet.</div>
              ) : (
                <div className="space-y-3">
                  {seasonRates.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {r.type === "NOMINAL"
                            ? `Nominal: Rp ${Number(r.value).toLocaleString()}`
                            : `Percentage: ${Number(r.value)}%`}
                        </div>
                        <div className="text-gray-600">
                          {format(parseISO(r.startDate), "dd MMM yyyy")} - {format(parseISO(r.endDate), "dd MMM yyyy")}
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
      {/* Room Images */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Room Images *</h2>
        {previewImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {previewImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <div className="relative h-32 rounded-lg overflow-hidden border">
                  <Image src={img} alt={`Room image ${idx + 1}`} fill className="object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => idx < existingImages.length ? handleRemoveExistingImage(existingImages[idx].id) : handleRemoveNewImage(idx - existingImages.length)}
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
            <div className="text-sm text-gray-600">Click to upload images (max 1MB each)</div>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" onClick={() => window.history.back()}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
          Cancel
        </button>
        <button type="submit" disabled={submitting || isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {submitting || isSubmitting ? "Saving..." : room ? "Update Room" : "Create Room"}
        </button>
      </div>
    </form>
  );
}
