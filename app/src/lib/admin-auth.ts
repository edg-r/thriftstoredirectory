import { NextRequest, NextResponse } from "next/server";

const ADMIN_KEY_QUERY_PARAM = "adminKey";
const ADMIN_KEY_HEADER = "x-admin-key";

export function getConfiguredAdminAccessKey() {
  const value = process.env.ADMIN_ACCESS_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

export function isValidAdminAccessKey(candidate: string | null | undefined) {
  const configured = getConfiguredAdminAccessKey();
  if (!configured) return false;
  return candidate === configured;
}

export function extractAdminAccessKey(request: NextRequest) {
  return (
    request.headers.get(ADMIN_KEY_HEADER) ??
    request.nextUrl.searchParams.get(ADMIN_KEY_QUERY_PARAM) ??
    null
  );
}

export function requireAdminApiAccess(request: NextRequest) {
  const configured = getConfiguredAdminAccessKey();
  if (!configured) {
    return NextResponse.json(
      {
        error: "Admin access is not configured. Set ADMIN_ACCESS_KEY in app/.env.",
      },
      { status: 503 },
    );
  }

  const provided = extractAdminAccessKey(request);
  if (!isValidAdminAccessKey(provided)) {
    return NextResponse.json(
      {
        error: "Unauthorized admin access",
        hint: `Pass the admin key using header ${ADMIN_KEY_HEADER} or ?${ADMIN_KEY_QUERY_PARAM}=...`,
      },
      { status: 401 },
    );
  }

  return null;
}
