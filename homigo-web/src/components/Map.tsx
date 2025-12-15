"use client";
export function Map({ query }: { query: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div className="card overflow-hidden">
      <iframe title="map" src={src} width="100%" height="260" style={{ border: 0 }} allowFullScreen loading="lazy"></iframe>
    </div>
  );
}
