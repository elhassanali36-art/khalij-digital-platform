import { timingSafeEqual } from "node:crypto";

export function isAdminKeyConfigured() {
  return Boolean(process.env.ADMIN_SETUP_KEY && process.env.ADMIN_SETUP_KEY.length >= 16);
}

export function isValidAdminKey(provided: string) {
  const expected = process.env.ADMIN_SETUP_KEY ?? "";
  if (expected.length < 16 || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export function getAdminKeyFromRequest(req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) return authorization.slice(7);
  return req.headers.get("x-admin-key") ?? "";
}
