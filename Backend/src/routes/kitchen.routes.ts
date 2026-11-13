import { NextFunction, Request, Response, Router } from "express";
import { query, validationResult } from "express-validator";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { listKitchenOrders } from "../controllers/kitchen.controller";

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

export default router;
