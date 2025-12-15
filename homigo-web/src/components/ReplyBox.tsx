"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function ReplyBox({ reviewId, existingReply, onReplied }: { reviewId: string; existingReply?: string; onReplied?: (reply: string) => void }) {
  const [role, setRole] = useState<string>("");
  const [reply, setReply] = useState<string>(existingReply || "");
  useEffect(() => {
    api.get("/users/me").then(r=> setRole((r.data?.role) || "")).catch(()=> setRole(""));
  }, []);
  if (role !== "TENANT") return null;
  return (
    <div className="mt-2">
      <textarea className="w-full rounded border p-2" placeholder="Balasan" value={reply} onChange={(e)=> setReply(e.target.value)} />
      <button className="pill bg-blue-600 text-white px-3 py-1 mt-1" onClick={async ()=>{ await api.post(`/reviews/${reviewId}/reply`, { reply }); if (onReplied) onReplied(reply); }}>Kirim Balasan</button>
    </div>
  );
}
