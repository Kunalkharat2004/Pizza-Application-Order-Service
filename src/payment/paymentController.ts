import { Request, Response } from "express";
import { PaymentGW } from "./paymentTypes";
import orderModel from "../orders/orderModel";
import { PaymentStatus } from "../orders/orderTypes";

export class PaymentController {
  constructor(private paymentGateway: PaymentGW) {}

  handleWebhook = async (req: Request, res: Response) => {
    const webhookBody = req.body;

    if (webhookBody.type === "checkout.session.completed") {
      const verifiedSession = await this.paymentGateway.getSession(
        webhookBody.data.object.id,
      );

      console.log("Payment session verified:", verifiedSession);

      const isPaymentSuccessful = verifiedSession.paymentStatus === PaymentStatus.PAID;

      const updatedOrder = await orderModel.findOneAndUpdate(
        {
          _id: verifiedSession.metadata.orderId,
        },
        {
          paymentStatus: isPaymentSuccessful
            ? PaymentStatus.PAID
            : PaymentStatus.FAILED,
        },
        { new: true }, // return the updated document
      );

      // Send updated order to kafka broker
      console.log("Updated order:", updatedOrder);
    }

    return res.json({success:true});
  };
}
