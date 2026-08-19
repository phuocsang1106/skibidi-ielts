export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly publicMessage = message
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toPublicError(error: unknown) {
  if (error instanceof AppError) return { status: error.status, code: error.code, message: error.publicMessage };
  console.error("Unhandled server error", error);
  return { status: 500, code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." };
}
