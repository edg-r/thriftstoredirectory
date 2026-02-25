import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  getConfiguredAdminAccessKey,
  isValidAdminAccessKey,
} from "@/lib/admin-auth";
import { getClientIpFromHeaders } from "@/lib/request-meta";
import { checkRateLimit } from "@/lib/rate-limit";

type SessionPayload = { adminKey?: unknown };

function asOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function parseBody(request: NextRequest): Promise<SessionPayload> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as SessionPayload;
  }
  return {};
}

export async function GET(request: NextRequest) {
  const configured = Boolean(getConfiguredAdminAccessKey());
  const active = configured && Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  return NextResponse.json({ configured, active });
}

export async function POST(request: NextRequest) {
  const ip = getClientIpFromHeaders(request.headers);
  const rateLimit = checkRateLimit({
    key: `admin-session:${ip}`,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many admin login attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const configured = getConfiguredAdminAccessKey();
  if (!configured) {
    return NextResponse.json(
      { error: "Admin access is not configured. Set ADMIN_ACCESS_KEY." },
      { status: 503 },
    );
  }

  const body = await parseBody(request);
  const adminKey = asOptionalString(body.adminKey);

  if (!isValidAdminAccessKey(adminKey)) {
    return NextResponse.json({ error: "Invalid admin key" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: adminKey!,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
