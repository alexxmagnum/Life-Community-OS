import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  for (const name of [
    "lcos-access-token",
    "lcos-refresh-token",
    "lcos-local-identity",
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
  }
  return response;
}
