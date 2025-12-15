"use client";
import React from "react";

export function LineChart({ data, width = 600, height = 160 }: { data: number[]; width?: number; height?: number }) {
  const max = Math.max(1, ...data);
  const stepX = width / Math.max(1, data.length - 1);
  const points = data.map((y, i) => {
    const px = i * stepX;
    const py = height - (y / max) * (height - 10) - 5;
    return `${px},${py}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <polyline points={points} fill="none" stroke="#5fa8f4" strokeWidth="3" />
      {data.map((y, i) => {
        const px = i * stepX;
        const py = height - (y / max) * (height - 10) - 5;
        return <circle key={i} cx={px} cy={py} r={3} fill="#5fa8f4" />;
      })}
    </svg>
  );
}
