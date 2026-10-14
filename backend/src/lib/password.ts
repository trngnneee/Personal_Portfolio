import { hash, verify } from "@node-rs/argon2";

// @node-rs/argon2 defaults to argon2id (m=19456, t=2, p=1 — OWASP baseline).
export function hashPassword(password: string): Promise<string> {
  return hash(password);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password).catch(() => false);
}

let dummyHash: Promise<string> | undefined;

/** Burn the same CPU as a real check so a wrong email isn't faster than a wrong password. */
export async function verifyDummy(password: string): Promise<false> {
  dummyHash ??= hash("dummy-password-for-timing-only");
  await verifyPassword(await dummyHash, password);
  return false;
}
