// src/auth/authorization.ts
import { HttpError } from "../utils/errors";
import { logger } from "../utils/logger";

export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
  VIEWER = "VIEWER",
}

export interface AuthorizedRequest extends Request {
  user: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
}

// Role hierarchy: ADMIN > USER > VIEWER
const roleHierarchy = {
  [Role.ADMIN]: 3,
  [Role.USER]: 2,
  [Role.VIEWER]: 1,
};

export function requireRole(minRole: Role) {
  return (req: any, _res: any, next: any) => {
    if (!req.user) {
      return next(new HttpError(401, "User not authenticated"));
    }

    const userRole = req.user.role as Role;
    const requiredLevel = roleHierarchy[minRole] || 0;
    const userLevel = roleHierarchy[userRole] || 0;

    if (userLevel < requiredLevel) {
      logger.warn(
        {
          userId: req.user.id,
          userRole,
          requiredRole: minRole,
          path: req.path,
        },
        "Insufficient permissions"
      );

      return next(
        new HttpError(
          403,
          `Insufficient permissions. Required: ${minRole}, Current: ${userRole}`
        )
      );
    }

    next();
  };
}

// Specific permission checks
export const requireAdmin = requireRole(Role.ADMIN);
export const requireUser = requireRole(Role.USER);
export const requireViewer = requireRole(Role.VIEWER);

// Check if user owns resource or is admin
export function requireOwnershipOrAdmin(resourceUserIdField = "userId") {
  return (req: any, _res: any, next: any) => {
    if (!req.user) {
      return next(new HttpError(401, "User not authenticated"));
    }

    const userRole = req.user.role as Role;
    const isAdmin = userRole === Role.ADMIN;

    // Admins can access any resource
    if (isAdmin) {
      return next();
    }

    // Check ownership based on tenant or user ID
    const resourceUserId =
      req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const isSameTenant =
      req.user.tenantId === resourceUserId || req.user.id === resourceUserId;

    if (!isSameTenant) {
      logger.warn(
        {
          userId: req.user.id,
          tenantId: req.user.tenantId,
          resourceUserId,
          path: req.path,
        },
        "Access denied: not owner"
      );

      return next(
        new HttpError(403, "Access denied: insufficient permissions")
      );
    }

    next();
  };
}
