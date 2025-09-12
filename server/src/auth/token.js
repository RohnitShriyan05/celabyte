"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUserToken = signUserToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function signUserToken(user) {
    const secret = env_1.env.jwt.hs256Secret || "changeme";
    return jsonwebtoken_1.default.sign({ sub: user.id, email: user.email, tenantId: user.tenantId }, secret, { expiresIn: "12h" });
}
