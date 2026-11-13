import { NextFunction, Request, Response, Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { uploadItemPhoto } from "../middlewares/upload.middleware";
import {
  listKitchenOrders,
  pickupOrder,
  updateKitchenItem,
  updateOrderStatus,
  uploadKitchenItemPhoto,
} from "../controllers/kitchen.controller";

const router = Router();

// Every kitchen route: logged in AND role = kitchen (employee token gets 403).
router.use(requireAuth, requireRole("kitchen"));

// Local validation handler so this file is self-contained.
// Swap it for the one in validation.middleware.ts if that has the same job.
const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return;
  }
  next();
};

const ALL_STATUSES = ["placed", "preparing", "ready", "picked_up", "cancelled"];

const idParam = param("id")
  .isInt({ min: 1 })
  .withMessage("id must be a positive integer");

// ---------- orders ----------

router.get(
  "/orders",
  query("status")
    .optional()
    .isIn(["placed", "preparing", "ready"])
    .withMessage("status must be placed, preparing or ready"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be 1 or more"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
  validate,
  listKitchenOrders,
);

// A valid status that is not the next step (e.g. placed -> picked_up) is a 409
// from the controller; only an unknown value is rejected here with 400.
router.patch(
  "/orders/:id/status",
  idParam,
  body("to").isIn(ALL_STATUSES).withMessage("'to' must be a valid order status"),
  validate,
  updateOrderStatus,
);

router.post(
  "/orders/:id/pickup",
  idParam,
  body("code")
    .exists()
    .withMessage("code is required")
    .bail()
    .matches(/^\d{4}$/)
    .withMessage("Pickup code must be 4 digits"),
  validate,
  pickupOrder,
);

// ---------- menu control ----------

router.patch(
  "/items/:id",
  idParam,
  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be true or false")
    .bail()
    .toBoolean(),
  body("stockLeft")
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage("stockLeft must be a whole number from 0 to 10000")
    .bail()
    .toInt(),
  validate,
  updateKitchenItem,
);

router.post(
  "/items/:id/photo",
  idParam,
  validate,
  uploadItemPhoto,
  uploadKitchenItemPhoto,
);

export default router;