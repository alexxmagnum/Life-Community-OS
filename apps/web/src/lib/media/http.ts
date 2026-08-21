import { NextResponse } from "next/server";
import { MediaDeniedError } from "./server-media-repository";

export function mediaErrorResponse(error: unknown): NextResponse {
  if (error instanceof MediaDeniedError) {
    const status =
      error.code === "not_found"
        ? 404
        : error.code === "unauthorized"
          ? 401
          : error.code === "mime_not_allowed" ||
              error.code === "file_too_large" ||
              error.code === "invalid_filename" ||
              error.code === "invalid_size" ||
              error.code === "storage_key_forbidden" ||
              error.code === "invalid_reference" ||
              error.code === "upload_failed"
            ? 400
            : 403;
    return NextResponse.json({ error: error.code }, { status });
  }
  throw error;
}
