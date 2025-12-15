import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(base64: string) {
  const res = await cloudinary.uploader.upload(base64, { folder: "homigo/payment-proof" });
  return res.secure_url;
}

export async function uploadAvatarBuffer(userId: string, buffer: Buffer) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        public_id: `user-${userId}`,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
        unique_filename: false,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
      }
    );
    stream.end(buffer);
  });
}

export async function destroyByPublicId(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (e) {
    // swallow delete errors
  }
}

export async function uploadPaymentProofBuffer(
  bookingId: string,
  buffer: Buffer
) {
  return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "payment-proofs",
        public_id: `payment-${bookingId}`,
        overwrite: true,
        invalidate: true,
        resource_type: "image",
        unique_filename: false,
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ secure_url: result.secure_url!, public_id: result.public_id! });
      }
    );
    stream.end(buffer);
  });
}
