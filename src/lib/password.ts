import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// scrypt عبر مكتبة node:crypto القياسية — لا حاجة لإضافة تبعية جديدة (bcrypt/argon2).
// N=16384 هو القيمة الافتراضية الموصى بها لعام 2024+ لكلمات مرور المستخدمين.
const KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plain, salt, KEY_LENGTH, SCRYPT_PARAMS);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string | null): boolean {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, saltHex, hashHex] = parts;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = scryptSync(plain, salt, expected.length, SCRYPT_PARAMS);
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function isStrongEnoughPassword(plain: string): boolean {
  return typeof plain === "string" && plain.length >= 8 && plain.length <= 200;
}
