import { Request, Response } from "express";
import { PaymentGW } from "./paymentTypes";
import orderModel from "../orders/orderModel";
import { OrderEvents, PaymentStatus } from "../orders/orderTypes";
import { MessageBroker } from "../types/broker";

export class PaymentController {
  constructor(private paymentGateway: PaymentGW, private broker: MessageBroker) {}

  handleWebhook = async (req: Request, res: Response) => {
    const webhookBody = req.body;

    if (webhookBody.type === "checkout.session.completed") {
      const verifiedSession = await this.paymentGateway.getSession(
        webhookBody.data.object.id,
      );

      const isPaymentSuccessful = verifiedSession.paymentStatus === PaymentStatus.PAID;
      console.log("Payment status:", isPaymentSuccessful);

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
      )
      .populate("customerId","firstName lastName email")
      .exec();
      // Send message to broker
      const brokerMessage = {
        event_type: OrderEvents.PAYMENT_STATUS_UPDATE,
        data: {
          ...updatedOrder.toObject(),
        },
      };

      await this.broker.sendMessage(
        "order",
        JSON.stringify(brokerMessage),
        updatedOrder._id.toString()
      );
    }

    return res.json({success:true});
  };
}
