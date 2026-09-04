/**
 * ==============================================================================
 * Cloudinary Upload Service
 * ==============================================================================
 * 
 * ARCHITECTURE EXPLANATION:
 * In traditional Java (Spring) or PHP (Laravel), file uploads are sent to the backend
 * server using `enctype="multipart/form-data"`. The backend reads the byte stream
 * and writes the file to the local hard drive (e.g., `storage/app/public/`).
 * 
 * In modern cloud / serverless architecture:
 * 1. The browser talks directly to Cloudinary's global Content Delivery Network (CDN).
 * 2. We use an "Unsigned Upload Preset" so the browser can securely upload without
 *    exposing private API Secret keys.
 * 3. Bypasses Vercel's 4.5 MB serverless payload limit, supporting large PDFs and
 *    slide decks up to 25 MB.
 * 4. Returns a permanent HTTPS CDN URL and file metadata that we save to Firestore.
 */

export type AttachmentCategory = "image" | "pdf" | "presentation" | "document" | "raw";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  originalFilename: string;
  format: string;
  bytes: number;
  attachmentType: AttachmentCategory;
}

/**
 * Categorize a file by its extension and MIME type
 * Connects to Java/Python file extension checking (e.g., `filename.endsWith(".pdf")`)
 */
export function categorizeFile(file: File): AttachmentCategory {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const mimeType = file.type.toLowerCase();

  if (
    mimeType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)
  ) {
    return "image";
  }

  if (mimeType === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (
    ["ppt", "pptx", "odp", "key"].includes(extension) ||
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint")
  ) {
    return "presentation";
  }

  if (
    ["doc", "docx", "txt", "rtf", "odt"].includes(extension) ||
    mimeType.includes("word") ||
    mimeType.includes("document")
  ) {
    return "document";
  }

  return "raw";
}

/**
 * Format bytes into human-readable sizes (KB, MB)
 * e.g., 2048000 -> "1.95 MB"
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Upload any academic file (photo, PDF, presentation) directly to Cloudinary
 * 
 * @param file The browser File object from <input type="file">
 * @returns Promise with the permanent HTTPS URL and file metadata
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env.local file."
    );
  }

  // Enforce 25 MB max limit to keep uploads snappy and within free tier allowances
  const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`File is too large (${formatFileSize(file.size)}). Maximum allowed size is 25 MB.`);
  }

  // Construct standard HTTP multipart/form-data payload
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const attachmentType = categorizeFile(file);

  // In Cloudinary:
  // - Images (jpg, png, webp, gif) belong in 'image/upload'.
  // - Academic documents (PDF, PPT, PPTX, DOCX, ZIP) MUST be uploaded as 'raw/upload'.
  //   If a PDF is uploaded to 'auto' or 'image', Cloudinary treats it as a raster graphic,
  //   causing 0-byte downloads and "Failed to load PDF document" errors in browsers.
  const resourceType = attachmentType === "image" ? "image" : "raw";
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Upload failed with status ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    originalFilename: file.name,
    format: data.format || file.name.split(".").pop() || "",
    bytes: data.bytes || file.size,
    attachmentType,
  };
}
