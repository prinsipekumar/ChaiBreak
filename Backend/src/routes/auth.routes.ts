import { Router } from "express";
import { requestOtp } from "../controllers/auth.controller";
import {
  sendOTPValidation,
  aliasPhoneField,
  validateRequest,
} from "../validators/auth.validator";

const router = Router();

// Route: POST /api/v1/auth/request-otp
router.post(
  "/request-otp",
  aliasPhoneField,
  sendOTPValidation,
  validateRequest,
  requestOtp,
);

export default router;
