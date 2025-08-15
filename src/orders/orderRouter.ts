import { Router } from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { Order } from "./orderController";
import { orderStatusValidator, orderValidator } from "./orderValidator";
import { handleValidationErrors } from "../common/middleware/validate-schema";
import createPaymentGateway from "../common/factories/paymentGwFactory";
import { createMessageBroker } from "../common/factories/brokerFactory";
import logger from "../config/logger";
import { OrderService } from "./orderService";
import canAccess from "../common/middleware/canAccess";
import { ROLES } from "../common/constants";

const router = Router();
const paymentGateway = createPaymentGateway();
const broker = createMessageBroker();
const orderService = new OrderService();
const OrderController = new Order(paymentGateway,broker,orderService,logger);

// GET all orders
router.get(
    "/",
    authenticate,
    canAccess([ROLES.ADMIN, ROLES.MANAGER]),
    asyncWrapper(OrderController.getAllOrders)
)

// GET all orders for dashboard
router.get(
    "/dashboard",
    authenticate,
    canAccess([ROLES.ADMIN, ROLES.MANAGER]),
    asyncWrapper(OrderController.getAllOrdersForDashboard)
)

// GET orders of customer
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

// PATCH to update order status
router.patch(
    "/change-status/:orderId",
    authenticate,
    orderStatusValidator,
    handleValidationErrors,
    asyncWrapper(OrderController.updateOrderStatus)
)



export default router;