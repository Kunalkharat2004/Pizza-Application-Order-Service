import { Router } from "express";
import authenticate from "../common/middleware/authenticate";
import { asyncWrapper } from "../utils";
import { Order } from "./orderController";

const router = Router();
const OrderController = new Order();

router.post(
    "/",
    authenticate,
    asyncWrapper(OrderController.create)
);

export default router;