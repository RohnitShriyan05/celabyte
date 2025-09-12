"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
// src/auth/rbac.ts
const errors_1 = require("../utils/errors");
function requireRole(min) {
    const rank = { VIEWER: 0, ANALYST: 1, ADMIN: 2, OWNER: 3 };
    return (req, _res, next) => {
        const r = req.role || req.user?.role || "VIEWER";
        if (rank[r] < rank[min])
            return next(new errors_1.HttpError(403, "insufficient role"));
        next();
    };
}
