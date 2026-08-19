import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, task1QuestionFile } from "@/lib/files";

describe("Task 1 upload validation", () => {
  it("accepts a supported image and preserves it for multimodal input", async () => {
    const file = new File([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00])], "chart.png", { type: "image/png" });
    const result = await task1QuestionFile(file);
    expect(result.mimeType).toBe("image/png");
    expect(result.dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it("accepts PDF", async () => {
    const file = new File([new TextEncoder().encode("%PDF-1.7\n")], "question.pdf", { type: "application/pdf" });
    expect((await task1QuestionFile(file)).mimeType).toBe("application/pdf");
  });

  it("rejects a declared image whose bytes do not match the MIME type", async () => {
    const file = new File([new Uint8Array([1,2,3,4])], "fake.png", { type: "image/png" });
    await expect(task1QuestionFile(file)).rejects.toMatchObject({ code: "FILE_INVALID" });
  });

  it("rejects unsupported files with the dedicated category", async () => {
    const file = new File(["x"], "question.gif", { type: "image/gif" });
    await expect(task1QuestionFile(file)).rejects.toMatchObject({ code: "UNSUPPORTED_FILE" });
  });

  it("rejects a file over 5 MB", async () => {
    const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "huge.png", { type: "image/png" });
    await expect(task1QuestionFile(file)).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });
});
