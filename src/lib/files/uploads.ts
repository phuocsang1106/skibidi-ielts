import mammoth from "mammoth";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const QUESTION_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf"]);
const WRITING_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf", "txt", "docx"]);

export type PreparedFile = {
  name: string;
  extension: string;
  mimeType: string;
  bytes: Buffer;
};

export class UploadValidationError extends Error {
  constructor(public readonly code: "FILE_TOO_LARGE" | "UNSUPPORTED_FILE" | "INVALID_FILE", message: string) {
    super(message);
  }
}

function extensionOf(name: string) {
  return name.toLowerCase().split(".").pop() || "";
}

function isJpeg(bytes: Buffer) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}
function isPng(bytes: Buffer) {
  return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}
function isPdf(bytes: Buffer) {
  return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
}
function isWebp(bytes: Buffer) {
  return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
}
function isZip(bytes: Buffer) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2] ?? -1);
}

function inferMime(extension: string, bytes: Buffer) {
  if ((extension === "jpg" || extension === "jpeg") && isJpeg(bytes)) return "image/jpeg";
  if (extension === "png" && isPng(bytes)) return "image/png";
  if (extension === "webp" && isWebp(bytes)) return "image/webp";
  if (extension === "pdf" && isPdf(bytes)) return "application/pdf";
  if (extension === "docx" && isZip(bytes)) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === "txt") return "text/plain";
  return null;
}

export async function prepareUpload(file: File, kind: "question" | "writing"): Promise<PreparedFile> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("FILE_TOO_LARGE", "File is too large. Maximum file size is 5 MB.");
  }
  if (file.size === 0) throw new UploadValidationError("INVALID_FILE", "The uploaded file is empty.");

  const extension = extensionOf(file.name);
  const allowed = kind === "question" ? QUESTION_EXTENSIONS : WRITING_EXTENSIONS;
  if (!allowed.has(extension)) {
    throw new UploadValidationError("UNSUPPORTED_FILE", `Unsupported ${kind} file format.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = inferMime(extension, bytes);
  if (!mimeType) throw new UploadValidationError("INVALID_FILE", "The file content does not match its extension.");

  return { name: file.name.replace(/[^A-Za-z0-9._-]/g, "_"), extension, mimeType, bytes };
}

export async function extractLocalWritingText(file: PreparedFile) {
  if (file.extension === "txt") return file.bytes.toString("utf8").trim();
  if (file.extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: file.bytes });
    return result.value.trim();
  }
  return null;
}

export function toGeminiInlineData(file: PreparedFile) {
  return { inlineData: { mimeType: file.mimeType, data: file.bytes.toString("base64") } };
}
