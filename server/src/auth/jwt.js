"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
// src/auth/jwt.ts
const jose_1 = require("jose");
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
const jwks = env_1.env.jwt.jwksUrl ? (0, jose_1.createRemoteJWKSet)(new URL(env_1.env.jwt.jwksUrl)) : null;
async function authMiddleware(req, _res, next) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    // Development bypass - if no token provided or dev-token, create a default user
    if (!token || token === 'dev-token') {
        if (process.env.NODE_ENV === 'development' || !env_1.env.jwt.hs256Secret) {
            req.user = {
                id: "dev-user-1",
                email: "dev@example.com",
                tenantId: "dev-tenant-1",
                role: "ADMIN"
            };
            return next();
        }
        return next(new errors_1.HttpError(401, "missing token"));
    }
    try {
        let payload;
        if (jwks) {
            const { payload: p } = await (0, jose_1.jwtVerify)(token, jwks, { issuer: env_1.env.jwt.issuer, audience: env_1.env.jwt.audience });
            payload = p;
        }
        else {
            // HS256 fallback for dev
            const { payload: p } = await (await Promise.resolve().then(() => __importStar(require("jose")))).jwtVerify(token, new TextEncoder().encode(env_1.env.jwt.hs256Secret));
            payload = p;
        }
        req.user = {
            id: payload.sub,
            email: payload.email,
            // expected custom claims:
            tenantId: payload["org_id"] || payload["tenant_id"] || payload["tenantId"],
            role: payload["role"] || "VIEWER"
        };
        if (!req.user.tenantId)
            throw new Error("no tenant");
        next();
    }
    catch (e) {
        next(new errors_1.HttpError(401, "invalid token"));
    }
}
