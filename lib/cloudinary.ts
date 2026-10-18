import { v2 as cloudinary } from "cloudinary";
import type { Photo } from "@/lib/collections";

const cloudName = () => process.env.CLOUDINARY_CLOUD_NAME ?? "";

function configured() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export const listingFolder = (shopId: string) => `treedorm/listings/${shopId}`;
/** Proof photos live apart from listing photos and are deleted once the order settles. */
export const proofFolder = (orderId: string) => `treedorm/proofs/${orderId}`;

/**
 * Signed params so the phone uploads straight to Cloudinary (SPEC §7 /api/uploads/sign); the API
 * secret never leaves the server. Uploads are limited to this shop's folder and to images.
 */
export function signUpload(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { folder, timestamp, allowed_formats: "jpg,jpeg,png,webp,heic,heif" };
  const signature = configured().utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  return {
    url: `https://api.cloudinary.com/v1_1/${cloudName()}/image/upload`,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    ...params,
    signature,
  };
}

/** True only for an image we let this shop upload: our cloud, its folder, https. */
export function isOwnUpload(photo: Photo, folder: string): boolean {
  try {
    const u = new URL(photo.url);
    return (
      u.protocol === "https:" &&
      u.hostname === "res.cloudinary.com" &&
      u.pathname.startsWith(`/${cloudName()}/image/upload/`) &&
      photo.publicId.startsWith(`${folder}/`) &&
      u.pathname.includes(photo.publicId)
    );
  } catch {
    return false;
  }
}

/** A resized delivery URL (Cloudinary transformation), e.g. for Gemini or thumbnails. */
export function resized(photo: Photo, width: number): string {
  return photo.url.replace("/image/upload/", `/image/upload/c_limit,w_${width},q_auto,f_jpg/`);
}

export async function deletePhotos(publicIds: string[]) {
  if (publicIds.length) await configured().api.delete_resources(publicIds);
}
