import { Router } from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { Order } from "./orderController";
import { orderValidator } from "./orderValidator";
import { handleValidationErrors } from "../common/middleware/validate-schema";
import { StripeGateway } from "../payment/stripe";

const router = Router();
const paymentGateway = new StripeGateway();
const OrderController = new Order(paymentGateway);

router.post(
    "/",
    authenticate,
    orderValidator,
    handleValidationErrors,
    asyncWrapper(OrderController.create)
);

export default router;