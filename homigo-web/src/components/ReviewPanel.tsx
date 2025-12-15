"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Me = { id: string; role: "USER" | "TENANT" };
type Booking = { id: string; checkOutDate: string; property: { id: string }; review?: { id: string } | null };

export function ReviewPanel({ propertyId, onSubmitted }: { propertyId: string; onSubmitted?: () => void }) {
  const [me, setMe] = useState<Me | null>(null);
  const [eligible, setEligible] = useState<Booking | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  useEffect(() => {
    api.get("/users/me").then(r=> setMe(r.data as Me)).catch(()=> setMe(null));
    api.get("/bookings/me").then(r=> {
      const items = (r.data as Booking[]).filter(b=> b.property.id === propertyId && !b.review && new Date(b.checkOutDate) < new Date());
      setEligible(items[0] || null);
    }).catch(()=> setEligible(null));
  }, [propertyId]);
  if (!me || me.role !== "USER") return null;
  if (!eligible) return <div className="text-sm text-neutral-600">Tidak ada booking yang bisa direview saat ini</div>;
  return (
    <form className="space-y-2" onSubmit={async (e)=>{ e.preventDefault(); await api.post("/reviews", { bookingId: eligible.id, rating, comment }); if (onSubmitted) onSubmitted(); }}>
      <div className="flex items-center gap-2">
        <label className="text-sm">Rating</label>
        <select value={rating} onChange={(e)=> setRating(Number(e.target.value))} className="rounded border p-1">
          {[1,2,3,4,5].map(n=> (<option key={n} value={n}>{n}</option>))}
        </select>
      </div>
      <textarea className="w-full rounded border p-2" placeholder="Tulis komentar (opsional)" value={comment} onChange={(e)=> setComment(e.target.value)} />
      <button className="pill bg-blue-600 text-white px-3 py-2" type="submit">Kirim Review</button>
    </form>
  );
}
