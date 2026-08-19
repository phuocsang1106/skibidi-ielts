export type NormalizedQuestionFile = {
  buffer: Buffer;
  mimeType: string;
  filename: string;
};

function fromSerializedBuffer(value: unknown): Buffer | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { type?: unknown; data?: unknown };
  if (candidate.type !== "Buffer" || !Array.isArray(candidate.data)) return null;
  if (!candidate.data.every((item) => Number.isInteger(item) && Number(item) >= 0 && Number(item) <= 255)) {
    return null;
  }
  return Buffer.from(candidate.data as number[]);
}

function parseDataUrl(value: string): { buffer: Buffer; mimeType: string } | null {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/i.exec(value.trim());
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2].replace(/\s+/g, ""), "base64"),
  };
}

function looksLikeBase64(value: string): boolean {
  const compact = value.replace(/\s+/g, "");
  return compact.length >= 8 && compact.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(compact);
}

function sniffMime(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "%PDF") return "application/pdf";
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return "image/png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) return "image/webp";
  return null;
}

function mimeFromFilename(filename: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

function normalizeMime(mimeType: string | null | undefined): string | null {
  if (!mimeType) return null;
  const mime = mimeType.toLowerCase().split(";")[0].trim();
  if (mime === "image/jpg" || mime === "image/pjpeg") return "image/jpeg";
  if (["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mime)) return mime;
  return null;
}

async function toBuffer(value: unknown): Promise<{ buffer: Buffer; mimeTypeFromDataUrl?: string } | null> {
  if (Buffer.isBuffer(value)) return { buffer: value };
  if (value instanceof Uint8Array) return { buffer: Buffer.from(value) };
  if (value instanceof ArrayBuffer) return { buffer: Buffer.from(new Uint8Array(value)) };

  const serialized = fromSerializedBuffer(value);
  if (serialized) return { buffer: serialized };

  if (typeof value === "string") {
    const dataUrl = parseDataUrl(value);
    if (dataUrl) return { buffer: dataUrl.buffer, mimeTypeFromDataUrl: dataUrl.mimeType };
    if (looksLikeBase64(value)) return { buffer: Buffer.from(value.replace(/\s+/g, ""), "base64") };
    return null;
  }

  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return { buffer: Buffer.from(new Uint8Array(await value.arrayBuffer())) };
  }

  return null;
}

export async function normalizeQuestionFile(input: unknown): Promise<NormalizedQuestionFile | null> {
  if (!input) return null;

  const direct = await toBuffer(input);
  if (direct) {
    const mimeType = normalizeMime(direct.mimeTypeFromDataUrl) ?? sniffMime(direct.buffer);
    if (!mimeType) return null;
    return {
      buffer: direct.buffer,
      mimeType,
      filename: mimeType === "application/pdf" ? "task1-question.pdf" : `task1-question.${mimeType.split("/")[1] === "jpeg" ? "jpg" : mimeType.split("/")[1]}`,
    };
  }

  if (typeof input !== "object") return null;
  const file = input as Record<string, unknown>;
  const filename = String(
    file.filename ?? file.name ?? file.originalName ?? file.originalFilename ?? "task1-question",
  );

  const candidates = [
    file.buffer,
    file.bytes,
    file.data,
    file.content,
    file.body,
    file.fileData,
    file.file_data,
    file.base64,
    file.dataUrl,
    file.dataURL,
    file.file,
  ];

  let converted: { buffer: Buffer; mimeTypeFromDataUrl?: string } | null = null;
  for (const candidate of candidates) {
    converted = await toBuffer(candidate);
    if (converted) break;
  }

  if (!converted && typeof (file as { arrayBuffer?: unknown }).arrayBuffer === "function") {
    const arrayBuffer = await (file as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
    converted = { buffer: Buffer.from(new Uint8Array(arrayBuffer)) };
  }

  if (!converted || converted.buffer.length === 0) return null;

  const declaredMime = normalizeMime(
    typeof file.mimeType === "string"
      ? file.mimeType
      : typeof file.mimetype === "string"
        ? file.mimetype
        : typeof file.type === "string"
          ? file.type
          : undefined,
  );

  const mimeType =
    normalizeMime(converted.mimeTypeFromDataUrl) ??
    declaredMime ??
    sniffMime(converted.buffer) ??
    mimeFromFilename(filename);

  if (!mimeType) return null;

  return { buffer: converted.buffer, mimeType, filename };
}
