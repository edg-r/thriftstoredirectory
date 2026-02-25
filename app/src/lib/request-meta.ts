import { createHash } from "crypto";

function firstForwardedIp(value: string | null) {
  if (!value) return null;
  return value.split(",")[0]?.trim() || null;
}

export function getClientIpFromHeaders(headers: Headers) {
  return (
    firstForwardedIp(headers.get("x-forwarded-for")) ??
    headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}

export function buildRequestFingerprint(headers: Headers) {
  const ip = getClientIpFromHeaders(headers);
  const userAgent = headers.get("user-agent") ?? "unknown";
  const salt = process.env.REQUEST_FINGERPRINT_SALT?.trim() || "dev-fingerprint-salt";

  return createHash("sha256").update(`${salt}|${ip}|${userAgent}`).digest("hex");
}
