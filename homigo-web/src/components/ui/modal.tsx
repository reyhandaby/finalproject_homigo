import React from 'react';

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void; }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-[90%] max-w-md">
        <div className="border-b p-3 font-medium">{title}</div>
        <div className="p-3">{children}</div>
        <div className="border-t p-3 text-right">
          <button className="rounded bg-neutral-800 text-white px-3 py-1" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
