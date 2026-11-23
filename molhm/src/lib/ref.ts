import { createHash, randomBytes } from "crypto";
export function hashIp(ip: string, salt = process.env.IP_HASH_SALT ?? "dev-salt") {
  return createHash("sha256").update(salt + ip).digest("hex").slice(0, 32);
}
export function newIdempotencyKey() { return randomBytes(16).toString("hex"); }
