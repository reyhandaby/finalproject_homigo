"use client";

import { useState } from "react";
import Image from "next/image";
import { PropertyImage } from "@/types";

interface ImageGalleryProps {
  images: PropertyImage[];
  propertyName: string;
}

export default function ImageGallery({
  images,
  propertyName,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-6xl">🏠</span>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-2 h-96">
        <div
          className="col-span-4 md:col-span-3 relative rounded-lg overflow-hidden cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src={images[selectedImage].url}
            alt={`${propertyName} - Image ${selectedImage + 1}`}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="col-span-4 md:col-span-1 grid grid-cols-4 md:grid-cols-1 gap-2">
          {images.slice(0, 4).map((image, index) => (
            <div
              key={image.id}
              className={`relative h-24 rounded-lg overflow-hidden cursor-pointer ${
                selectedImage === index ? "ring-2 ring-blue-600" : ""
              }`}
              onClick={() => setSelectedImage(index)}
            >
              <Image
                src={image.url}
                alt={`${propertyName} - Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === 3 && images.length > 4 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-semibold">
                  +{images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            onClick={() => setIsModalOpen(false)}
          >
            ×
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage((prev) =>
                prev === 0 ? images.length - 1 : prev - 1
              );
            }}
          >
            ‹
          </button>

          <div className="relative w-full max-w-5xl h-[80vh]">
            <Image
              src={images[selectedImage].url}
              alt={`${propertyName} - Image ${selectedImage + 1}`}
              fill
              className="object-contain"
            />
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
              );
            }}
          >
            ›
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
