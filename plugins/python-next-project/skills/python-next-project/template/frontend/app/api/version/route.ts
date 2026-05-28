import { NextResponse } from "next/server";

// Public, unauthenticated build-info probe (excluded from the auth gate).
export async function GET() {
  return NextResponse.json({ name: "myapp", version: "0.1.0" });
}
