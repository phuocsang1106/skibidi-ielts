import { z } from "zod";

export const credentialsSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Use letters, numbers, dot, underscore, or hyphen only"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128)
});

export const registerSchema = credentialsSchema
  .extend({ confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export const writingTextSchema = z.object({
  taskType: z.enum(["TASK_1", "TASK_2"]),
  input: z.string().trim().min(40, "Please provide enough text for the examiner to assess.").max(30000)
});

export const promoSchema = z.object({
  code: z.string().trim().min(3).max(40).transform((value) => value.toUpperCase())
});

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;

export function validateUpload(file: File) {
  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type as (typeof ACCEPTED_UPLOAD_TYPES)[number])) return "Only JPG, JPEG, PNG, WEBP, and PDF files are supported.";
  if (file.size > MAX_UPLOAD_BYTES) return "File size must be 5MB or less.";
  if (file.size === 0) return "The uploaded file is empty.";
  return null;
}

export function validateFileSignature(buffer: Buffer, mime: string) {
  if (mime === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (mime === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/webp") return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}
