import { Router } from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { Order } from "./orderController";
import { orderValidator } from "./orderValidator";
import { handleValidationErrors } from "../common/middleware/validate-schema";

const router = Router();
const OrderController = new Order();

router.post(
    "/",
    authenticate,
    orderValidator,
    handleValidationErrors,
    asyncWrapper(OrderController.create)
);

export default router;