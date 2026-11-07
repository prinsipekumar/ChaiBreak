import {
  body,
  validationResult,
  type ValidationChain,
} from "express-validator";
import type { Request, Response, NextFunction } from "express";
import { isSupportedCountry } from "libphonenumber-js/max";
import { parseAuthPhone } from "../utils/phone";

const authPhone = (): ValidationChain =>
  body("mobile")
    .exists({ checkFalsy: true })
    .withMessage("Mobile number is required")
    .isString()
    .withMessage("Mobile number must be a string")
    .custom((value: string, { req }) => {
      const country = (req.body as Record<string, unknown>)?.["country"];
      if (
        country !== undefined &&
        (typeof country !== "string" ||
          !/^[a-z]{2}$/i.test(country) ||
          !isSupportedCountry(country.toUpperCase()))
      ) {
        throw new Error("Country must be a valid two-letter country code");
      }
      if (!parseAuthPhone(value, country)) {
        throw new Error(
          "Please enter a valid phone number for the selected country",
        );
      }
      return true;
    });

export const aliasPhoneField = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const body = req.body as Record<string, unknown> | undefined;
  if (body) {
    if (body["mobile"] === undefined && body["phone"] !== undefined) {
      body["mobile"] = body["phone"];
    }
    if (!body["cuntry_code"]) {
      body["cuntry_code"] = "+91";
    }
  }
  next();
};

export const sendOTPValidation = [
  authPhone(),
  body("hash")
    .optional({ values: "falsy" })
    .isString()
    .withMessage("Hash must be a string")
    .matches(/^[A-Za-z0-9+/]{11}$/)
    .withMessage("Invalid SMS verification hash"),
];

// Added verification validator array mapping strict project specification rules
export const verifyOTPValidation = [
  authPhone(),
  body("code")
    .exists({ checkFalsy: true })
    .withMessage("Verification code is required")
    .isString()
    .withMessage("Verification code must be a string")
    .isLength({ min: 4, max: 4 })
    .withMessage("Verification code must be exactly 4 digits")
    .isNumeric()
    .withMessage("Verification code must contain only numbers"),
];

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: "path" in err ? err.path : "unknown",
        message: err.msg,
      })),
    });
    return;
  }
  next();
};
