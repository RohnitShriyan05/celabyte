import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function signUserToken(user: { id: string; email: string; tenantId?: string }) {
	const secret = env.jwt.hs256Secret || "changeme";
	return jwt.sign(
		{ sub: user.id, email: user.email, tenantId: user.tenantId },
		secret,
		{ expiresIn: "12h" }
	);
}


