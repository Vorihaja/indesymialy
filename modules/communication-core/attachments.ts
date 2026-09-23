import type {
  AttachmentKind,
  CommunicationAttachmentUpload,
} from "./types";

export const MESSAGE_ATTACHMENT_BUCKET =
  "message-attachments";

export const MESSAGE_ATTACHMENT_MAX_FILES = 5;

export const MESSAGE_ATTACHMENT_MAX_BYTES =
  6 * 1024 * 1024;

export const MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/webm",
] as const;

const allowedMimeTypes =
  new Set<string>(
    MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES,
  );

export const MESSAGE_ATTACHMENT_ACCEPT =
  MESSAGE_ATTACHMENT_ALLOWED_MIME_TYPES.join(
    ",",
  );

export function attachmentKindForMime(
  mimeType: string,
): AttachmentKind {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  if (
    mimeType === "application/pdf" ||
    mimeType === "text/plain" ||
    mimeType === "text/csv" ||
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("sheet")
  ) {
    return "document";
  }

  return "file";
}

export function sanitizeAttachmentName(
  name: string,
): string {
  const normalized =
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/\.{2,}/g, ".")
      .replace(/^[.-]+/g, "")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);

  return normalized || "fichier";
}

export function validateAttachmentFile(
  file: Pick<File, "name" | "size" | "type">,
): string | null {
  if (!allowedMimeTypes.has(file.type)) {
    return `${file.name} : format non pris en charge.`;
  }

  if (file.size <= 0) {
    return `${file.name} : le fichier est vide.`;
  }

  if (file.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
    return `${file.name} dépasse la limite de 6 Mo.`;
  }

  return null;
}

export function createAttachmentUpload(
  file: File,
): CommunicationAttachmentUpload {
  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    kind: attachmentKindForMime(file.type),
    size: file.size,
    mimeType: file.type,
  };
}

export function formatAttachmentSize(
  size: number,
): string {
  if (size < 1024) {
    return `${size} o`;
  }

  if (size < 1024 * 1024) {
    return `${Math.ceil(size / 1024)} Ko`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}
