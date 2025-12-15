"use client";
import { useRef } from "react";

export function DualRangeSlider({ min = 0, max = 10000000, step = 50000, value, onChange }: { min?: number; max?: number; step?: number; value: { min: number; max: number }; onChange: (v: { min: number; max: number }) => void }) {
  const track = useRef<HTMLDivElement>(null);
  function updateMin(n: number) { const next = { min: Math.min(n, value.max - step), max: value.max }; onChange(next); }
  function updateMax(n: number) { const next = { min: value.min, max: Math.max(n, value.min + step) }; onChange(next); }
  const left = ((value.min - min) / (max - min)) * 100;
  const right = ((value.max - min) / (max - min)) * 100;
  return (
    <div className="w-full">
      <div ref={track} className="relative h-2 rounded bg-neutral-200">
        <div className="absolute h-2 bg-blue-300 rounded" style={{ left: `${left}%`, width: `${right - left}%` }} />
        <input type="range" min={min} max={max} step={step} value={value.min} onChange={(e)=> updateMin(Number(e.target.value))} className="absolute -top-1 w-full appearance-none bg-transparent pointer-events-auto" />
        <input type="range" min={min} max={max} step={step} value={value.max} onChange={(e)=> updateMax(Number(e.target.value))} className="absolute -top-1 w-full appearance-none bg-transparent pointer-events-auto" />
      </div>
      <div className="flex justify-between text-xs text-neutral-600 mt-2">
        <span>Rp {value.min}</span>
        <span>Rp {value.max}</span>
      </div>
    </div>
  );
}
