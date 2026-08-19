import mammoth from "mammoth";
import { AppError } from "@/lib/errors";
import type { QuestionFile } from "@/lib/ai/types";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const TASK1_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const TEXT_MIME = new Set(["text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

function assertSize(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) throw new AppError("FILE_TOO_LARGE", "File exceeds 5 MB.", 413, "Files must be 5 MB or smaller. No Writing submission was deducted.");
  if (file.size === 0) throw new AppError("FILE_INVALID", "File is empty.", 400, "This file appears to be empty. No Writing submission was deducted.");
}

function startsWith(bytes: Buffer, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function contentMatchesMime(bytes: Buffer, mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp":
      return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    case "application/pdf":
      return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]);
    case "text/plain":
      return !bytes.includes(0);
    default:
      return false;
  }
}

function assertFileSignature(bytes: Buffer, mimeType: string) {
  if (!contentMatchesMime(bytes, mimeType)) {
    throw new AppError("FILE_INVALID", `File contents do not match declared MIME type ${mimeType}.`, 400, "This file appears to be invalid or corrupted. No Writing submission was deducted.");
  }
}

export async function task1QuestionFile(file: File): Promise<QuestionFile> {
  assertSize(file);
  if (!TASK1_MIME.has(file.type)) {
    throw new AppError("UNSUPPORTED_FILE", `Unsupported Task 1 file type: ${file.type}`, 415, "This file type isn't supported. Upload JPG, PNG, WebP or PDF. No Writing submission was deducted.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  assertFileSignature(bytes, file.type);
  return {
    name: file.name || "task1-question",
    mimeType: file.type as QuestionFile["mimeType"],
    dataUrl: `data:${file.type};base64,${bytes.toString("base64")}`
  };
}

export async function extractTextFile(file: File, label: "question" | "essay") {
  assertSize(file);
  if (!TEXT_MIME.has(file.type)) {
    throw new AppError("UNSUPPORTED_FILE", `Unsupported ${label} file type: ${file.type}`, 415, `${label === "essay" ? "Writing response" : "Question"} file uploads support TXT or DOCX. No Writing submission was deducted.`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  assertFileSignature(buffer, file.type);
  if (file.type === "text/plain") return buffer.toString("utf8").trim();
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    throw new AppError("FILE_INVALID", `Could not parse DOCX: ${error instanceof Error ? error.message : String(error)}`, 400, "This DOCX file appears to be invalid or corrupted. No Writing submission was deducted.");
  }
}

export function formFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}
