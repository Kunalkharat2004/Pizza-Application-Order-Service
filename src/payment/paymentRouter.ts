import { Router } from "express";
import { asyncWrapper } from "../utils";
import { PaymentController } from "./paymentController";
import createPaymentGateway from "../common/factories/paymentGwFactory";
import { createMessageBroker } from "../common/factories/brokerFactory";

const router = Router();

const paymentGateway = createPaymentGateway();
const broker = createMessageBroker();
const paymentController = new PaymentController(paymentGateway, broker);
// stripe listen --forward-to localhost:8000/api/order/api/payment/webhook

router.post("/webhook",
    asyncWrapper(paymentController.handleWebhook)
 )

export default router;