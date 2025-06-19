import { Router } from "express";
import authenticate from "../common/middleware/authenticate";
import canAccess from "../common/middleware/canAccess";
import { ROLES } from "../common/constants";
import { handleValidationErrors } from "../common/middleware/validate-schema";
import { couponValidator } from "./couponValidator";
import { Coupon } from "./couponController";
import logger from "../config/logger";
import { CouponService } from "./couponService";
import { asyncWrapper } from "../utils";

const router = Router();

const couponService = new CouponService();
const couponController = new Coupon(couponService,logger);

// Create coupon
router.post(
    "/",
    authenticate,
    canAccess([ROLES.ADMIN, ROLES.MANAGER]),
    couponValidator,
    handleValidationErrors,
    asyncWrapper(couponController.create)
)

// Update coupon 
router.patch(
    "/:id",
    authenticate,
    canAccess([ROLES.ADMIN, ROLES.MANAGER]),
    couponValidator,
    handleValidationErrors,
    asyncWrapper(couponController.update)
)

// Delete coupon
router.delete(
    "/:id",
    authenticate,
    canAccess([ROLES.ADMIN, ROLES.MANAGER]),
    asyncWrapper(couponController.delete)
)

export default router;