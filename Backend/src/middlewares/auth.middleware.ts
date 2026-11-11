import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    phone: string;
    role: "employee" | "kitchen";
  };
}

// JWT Authentication Middleware (Enforces Bearer <token>)
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authorization token missing or malformed.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

  try {
    const decoded = jwt.verify(token, jwtSecret) as {
      userId: number;
      phone: string;
      role: "employee" | "kitchen";
    };

    req.user = {
      id: decoded.userId,
      phone: decoded.phone,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error(
      "🔒 JWT Verification Error:",
      error instanceof Error ? error.message : error,
    );
    res.status(401).json({
      success: false,
      message: "Invalid or expired authorization token.",
    });
  }
};

// Dynamic Role Verification Middleware (Returns 403 on Failure)
export const requireRole = (role: "employee" | "kitchen") => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthenticated request context.",
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access requires the '${role}' role privilege framework.`,
      });
      return;
    }

    next();
  };
};
