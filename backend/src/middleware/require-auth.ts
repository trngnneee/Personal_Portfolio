import type { RequestHandler } from "express";
import type { AppContext } from "../context.js";
import { getAccount } from "../modules/auth/service.js";
import { unauthorized } from "./error.js";

/** Verifies Bearer JWT signature + expiry + token_version. Mounted once on the admin router. */
export function requireAuth({ db, jwt }: AppContext): RequestHandler {
  return async (req, _res, next) => {
    const [scheme, token] = (req.get("authorization") ?? "").split(" ");
    if (scheme !== "Bearer" || !token) throw unauthorized();

    const claims = await jwt.verify(token);
    if (!claims) throw unauthorized();

    const account = await getAccount(db);
    if (!account || account.tokenVersion !== claims.tv) throw unauthorized();

    next();
  };
}
