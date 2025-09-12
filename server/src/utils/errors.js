"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.forbidden = exports.badReq = exports.HttpError = void 0;
// src/utils/errors.ts
class HttpError extends Error {
    constructor(status, msg) {
        super(msg);
        this.status = status;
    }
}
exports.HttpError = HttpError;
const badReq = (m) => new HttpError(400, m);
exports.badReq = badReq;
const forbidden = (m) => new HttpError(403, m);
exports.forbidden = forbidden;
const notFound = (m) => new HttpError(404, m);
exports.notFound = notFound;
