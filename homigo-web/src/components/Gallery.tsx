"use client";
import Image from "next/image";
import { useState } from "react";

type Img = { id: string; url: string };

const BLUR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAoMBg3nM8NwAAAAASUVORK5CYII=";

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0);
  const [startX, setStartX] = useState<number | null>(null);
  const arr = images?.length ? images : [];
  const current = arr[i];
  function prev(){ setI((p)=> (p-1+arr.length)%arr.length); }
  function next(){ setI((p)=> (p+1)%arr.length); }
  if (!arr.length) return null;
  return (
    <div className="relative card overflow-hidden" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='ArrowLeft') prev(); if(e.key==='ArrowRight') next(); }} onTouchStart={(e)=>setStartX(e.touches[0].clientX)} onTouchEnd={(e)=>{ if(startX===null) return; const dx = e.changedTouches[0].clientX - startX; if(dx>40) prev(); if(dx<-40) next(); setStartX(null); }}>
      <Image src={current.url} alt={name} width={1200} height={500} className="w-full h-72 md:h-96 object-cover" placeholder="blur" blurDataURL={BLUR} />
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
      <button aria-label="Prev" onClick={prev} className="pill absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 px-3 py-1">‹</button>
      <button aria-label="Next" onClick={next} className="pill absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 px-3 py-1">›</button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {arr.slice(0,6).map((img, idx)=>(
          <button key={img.id} aria-label={`Go ${idx}`} onClick={()=>setI(idx)} className={`h-2 w-2 rounded-full ${idx===i? 'bg-white' : 'bg-black/40'}`} />
        ))}
      </div>
    </div>
  );
}
