import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("lcos-access-token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("lcos-refresh-token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
