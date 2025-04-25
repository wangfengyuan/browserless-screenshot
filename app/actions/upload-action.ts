import { R2 } from "../lib/s3-client";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

export async function generateFileName(imageData: ArrayBuffer | Buffer, extension: string) {
  // Convert ArrayBuffer to Buffer if needed
  const buffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData);

  // Create SHA-256 hash from the actual image data
  const hash = crypto
    .createHash("sha256")
    .update(buffer)
    .digest("base64")
    // Replace non-filename-safe characters
    .replace(/[/+=]/g, "");

  return `${hash}.${extension}`;
}

export async function checkFileExists(filename: string) {
  try {
    await R2.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function uploadToR2(filename: string, data: Buffer | ArrayBuffer) {
  let bodyData = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const extension = getExtension(filename);

  const contentType = getMimeType(extension === "heic" ? "jpg" : extension);

  await R2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: bodyData,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000",
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${filename}`;
}


export function getExtension(str: string): string {
  const lower = str.toLowerCase();

  if (lower.includes(".png")) return "png";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "jpg";
  if (lower.includes(".gif")) return "gif";
  if (lower.includes(".webp")) return "webp";
  if (lower.includes(".svg")) return "svg";
  if (lower.includes(".ico")) return "ico";
  if (lower.includes(".tiff") || lower.includes(".tif")) return "tiff";
  if (lower.includes(".avif")) return "avif";
  if (lower.includes(".heic") || lower.includes(".heif")) return "heic";
  return "jpg"; // default fallback
}

export function getMimeType(extension: string): string {
  const contentTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    tiff: "image/tiff",
    avif: "image/avif",
    heic: "image/heic",
  };
  return contentTypes[extension as keyof typeof contentTypes] || "image/jpeg";
}
