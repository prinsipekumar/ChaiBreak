import { Router } from "express";
import { param } from "express-validator";
import {
  cancelOrder,
  getMyOrders,
  getOrderById,
  placeOrder,
} from "../controllers/order.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateResult } from "../middlewares/validation.middleware";

const router = Router();

const orderIdValidation = [
  param("id")
    .exists()
    .withMessage("Order ID is required.")
    .isInt({ min: 1 })
    .withMessage("Order ID must be a positive integer.")
    .toInt(),
  validateResult,
];

router.post("/orders", placeOrder);

router.get("/me", requireAuth, getMyOrders);

router.get("/:id", requireAuth, orderIdValidation, getOrderById);

router.patch("/:id/cancel", requireAuth, orderIdValidation, cancelOrder);

export default router;
