import { Router } from "express";
import { body } from "express-validator";
import {
  requestOtpController,
  verifyOtpController,
} from "../controllers/auth.controller";
import { validateResult } from "../middlewares/validation.middleware";

const router = Router();

// POST /api/v1/auth/request-otp
router.post(
  "/request-otp",
  [
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required.")
      .matches(/^[6-9]\d{9}$/)
      .withMessage(
        "Phone number must be exactly 10 digits and start with a number from 6 to 9.",
      ),
    validateResult,
  ],
  requestOtpController,
);

// POST /api/v1/auth/verify-otp
router.post(
  "/verify-otp",
  [
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required.")
      .matches(/^[6-9]\d{9}$/)
      .withMessage(
        "Phone number must be exactly 10 digits and start with a number from 6 to 9.",
      ),
    body("code")
      .trim()
      .notEmpty()
      .withMessage("OTP verification code is required.")
      .isLength({ min: 4, max: 4 })
      .withMessage("OTP must be exactly 4 digits."),
    validateResult,
  ],
  verifyOtpController,
);

export default router;
