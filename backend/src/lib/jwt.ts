import { jwtVerify, SignJWT } from "jose";

export const TOKEN_TTL_SECONDS = 8 * 60 * 60;

export interface AdminClaims {
  sub: "admin";
  tv: number;
}

export function createJwt(secret: string) {
  const key = new TextEncoder().encode(secret);

  return {
    async sign(tokenVersion: number, nowSeconds = Math.floor(Date.now() / 1000)) {
      const exp = nowSeconds + TOKEN_TTL_SECONDS;
      const token = await new SignJWT({ tv: tokenVersion })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("admin")
        .setIssuedAt(nowSeconds)
        .setExpirationTime(exp)
        .sign(key);
      return { token, expiresAt: new Date(exp * 1000).toISOString() };
    },

    /** Returns claims, or null when the signature/expiry/shape is invalid. */
    async verify(token: string): Promise<AdminClaims | null> {
      try {
        const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
        if (payload.sub !== "admin" || typeof payload.tv !== "number") return null;
        return { sub: "admin", tv: payload.tv };
      } catch {
        return null;
      }
    },
  };
}

export type Jwt = ReturnType<typeof createJwt>;
