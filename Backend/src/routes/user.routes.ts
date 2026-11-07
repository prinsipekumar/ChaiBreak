import { Router } from "express";
import { getMe, updateMe } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { body } from "express-validator";
import { validateResult } from "../middlewares/validation.middleware";

const router = Router();

// Protect all /me profile routes with JWT Auth
router.use(requireAuth);

// GET /api/v1/me
router.get("/", getMe);

// PATCH /api/v1/me
router.patch(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required and cannot be empty.")
      .isLength({ max: 100 })
      .withMessage("Name cannot exceed 100 characters."),
    validateResult,
  ],
  updateMe,
);

export default router;
