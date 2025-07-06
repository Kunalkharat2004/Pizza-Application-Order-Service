import { Router } from "express";
import { asyncWrapper } from "../utils";
import { PaymentController } from "./paymentController";
import createPaymentGateway from "../common/factories/paymentGwFactory";

const router = Router();

const paymentGateway = createPaymentGateway();
const paymentController = new PaymentController(paymentGateway);
// stripe listen --forward-to localhost:8000/api/order/api/payment/webhook

router.post("/webhook",
    asyncWrapper(paymentController.handleWebhook)
 )

export default router;