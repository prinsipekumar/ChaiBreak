import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

// Formats all validation failures into the exact spec response shape
export const validateResult = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Take the first validation error message to send back cleanly
    const firstErrorMessage = errors.array()[0].msg;

    res.status(400).json({
      success: false,
      message: firstErrorMessage,
    });
    return;
  }

  next();
};
