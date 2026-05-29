import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function safeFileName(name) {
  const cleaned = typeof name === "string" ? name.replace(/[^a-zA-Z0-9._-]/g, "_") : "";
  return cleaned || "upload";
}

export function assertImageFile(file) {
  if (!file) {
    throw new Error("Choose an image before uploading.");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Use a JPEG, PNG, WebP, or GIF image.");
  }

  if (file.size >= MAX_IMAGE_BYTES) {
    throw new Error("Use an image smaller than 5 MB.");
  }

  return file;
}

export function imageRefForUser(storage, uid, file) {
  if (!uid) {
    throw new Error("Sign in before uploading images.");
  }

  const uniqueId = globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
  return ref(storage, `uploads/${uid}/${uniqueId}-${safeFileName(file.name)}`);
}

export async function uploadUserImage({ storage, uid, file }) {
  const image = assertImageFile(file);
  const imageRef = imageRefForUser(storage, uid, image);
  const imageUpload = await uploadBytes(imageRef, image);
  return getDownloadURL(imageUpload.ref);
}
