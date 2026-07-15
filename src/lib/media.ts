export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
export const VIDEO_EXT = ["mp4", "mov", "webm"];

export const DEFAULT_MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const DEFAULT_MAX_VIDEO_BYTES = 80 * 1024 * 1024;
export const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024;
export const MAX_EDGE = 2048;

export type MediaKind = "image" | "video";

export function extOf(name: string): string {
  return (name.split(".").pop() ?? "").toLowerCase();
}

export function detectKind(file: File): MediaKind | null {
  if (IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number])) {
    return "image";
  }
  if (VIDEO_TYPES.includes(file.type as (typeof VIDEO_TYPES)[number])) {
    return "video";
  }
  const ext = extOf(file.name);
  if (IMAGE_EXT.includes(ext)) return "image";
  if (VIDEO_EXT.includes(ext)) return "video";
  return null;
}

export function acceptAttr(mode: "image" | "video" | "both"): string {
  const images =
    "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
  const videos = "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm";
  if (mode === "image") return images;
  if (mode === "video") return videos;
  return `${images},${videos}`;
}

export function validateFile(
  file: File,
  mode: "image" | "video" | "both",
  maxImageBytes = DEFAULT_MAX_IMAGE_BYTES,
  maxVideoBytes = DEFAULT_MAX_VIDEO_BYTES,
): string | null {
  const kind = detectKind(file);
  if (!kind) return "Unsupported file type.";
  if (mode === "image" && kind !== "image") return "Images only.";
  if (mode === "video" && kind !== "video") return "Videos only.";
  if (kind === "image" && file.size > maxImageBytes) {
    return `Images must be under ${Math.round(maxImageBytes / (1024 * 1024))}MB.`;
  }
  if (kind === "video" && file.size > maxVideoBytes) {
    return `Videos must be under ${Math.round(maxVideoBytes / (1024 * 1024))}MB.`;
  }
  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image."));
    img.src = src;
  });
}

/** Rotate clockwise by 90° steps and optionally compress / downscale. */
export async function processImageFile(
  file: File,
  options: {
    rotate?: 0 | 90 | 180 | 270;
    /** Crop in natural image coords before rotate */
    crop?: { x: number; y: number; w: number; h: number } | null;
    quality?: number;
  } = {},
): Promise<File> {
  const kind = detectKind(file);
  if (kind !== "image") return file;
  // HEIC often cannot be drawn to canvas in browsers
  if (
    file.type.includes("heic") ||
    file.type.includes("heif") ||
    ["heic", "heif"].includes(extOf(file.name))
  ) {
    return file;
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const rotate = options.rotate ?? 0;
    const crop = options.crop;

    const sx = crop?.x ?? 0;
    const sy = crop?.y ?? 0;
    const sw = crop?.w ?? img.naturalWidth;
    const sh = crop?.h ?? img.naturalHeight;

    let outW = sw;
    let outH = sh;
    if (rotate === 90 || rotate === 270) {
      outW = sh;
      outH = sw;
    }

    const scale = Math.min(1, MAX_EDGE / Math.max(outW, outH));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(outW * scale));
    canvas.height = Math.max(1, Math.round(outH * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.drawImage(
      img,
      sx,
      sy,
      sw,
      sh,
      (-sw * scale) / 2,
      (-sh * scale) / 2,
      sw * scale,
      sh * scale,
    );

    const quality = options.quality ?? (file.size > COMPRESS_THRESHOLD ? 0.82 : 0.92);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;
    const base = file.name.replace(/\.[^.]+$/, "") || "upload";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function autoProcessForUpload(file: File): Promise<File> {
  const kind = detectKind(file);
  if (kind !== "image") return file;
  if (
    file.size <= COMPRESS_THRESHOLD &&
    !file.type.includes("heic") &&
    !file.type.includes("heif")
  ) {
    // Still downscale huge dimensions
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      if (Math.max(img.naturalWidth, img.naturalHeight) <= MAX_EDGE) {
        return file;
      }
    } catch {
      return file;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return processImageFile(file, { rotate: 0 });
}
