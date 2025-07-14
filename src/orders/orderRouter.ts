import { Router } from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { Order } from "./orderController";
import { orderValidator } from "./orderValidator";
import { handleValidationErrors } from "../common/middleware/validate-schema";
import createPaymentGateway from "../common/factories/paymentGwFactory";
import { createMessageBroker } from "../common/factories/brokerFactory";
import logger from "../config/logger";
import { OrderService } from "./orderService";

const router = Router();
const paymentGateway = createPaymentGateway();
const broker = createMessageBroker();
const orderService = new OrderService();
const OrderController = new Order(paymentGateway,broker,orderService,logger);

// GET all orders
router.get(
    "/mine",
    authenticate,
    asyncWrapper(OrderController.getOrders)
)

router.post(
    "/",
    authenticate,
    orderValidator,
    handleValidationErrors,
    asyncWrapper(OrderController.create)
);

router.get(
    "/:orderId",
    authenticate,
    asyncWrapper(OrderController.getSingleOrder)
)

export default router;