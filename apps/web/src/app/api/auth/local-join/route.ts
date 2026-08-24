import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Local membership join when Supabase Auth is not configured.
 * Role is never taken from the client.
 */
export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    {
      error: "local_identity_disabled",
      message: "Use Supabase Auth to create a real session",
    },
    { status: 410 },
  );
}
