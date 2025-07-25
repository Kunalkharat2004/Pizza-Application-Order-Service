import Stripe from "stripe";
import config from "config";
import { CustomMetadata, PaymentGW, PaymentOptions, VerifiedSession } from "./paymentTypes";

export class StripeGateway implements PaymentGW {
    private stripe: Stripe;
    constructor() {
        this.stripe = new Stripe(config.get("stripe.secretKey"))
    }
    async createSession(options: PaymentOptions) {
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            metadata: {
                orderId: options.orderId,
                tenantId: options.tenantId,
            },
            line_items: [
                {
                    price_data: {
                        unit_amount: options.amount * 100,
                        currency: options.currency || "inr",
                        product_data: {
                            name: "Order Payment",
                            description: "Total amount to be paid",
                            images: [config.get("stripe.imageUrl")],
                        }
                    },
                    quantity: 1,
                }
            ],
            mode: "payment",
            success_url: `${config.get("frontend.clientUI")}/payment?success=true&orderId=${options.orderId}&restaurantId=${options.tenantId}`,
            cancel_url: `${config.get("frontend.clientUI")}/payment?success=false&orderId=${options.orderId}&restaurantId=${options.tenantId}`,
        },
            {
                idempotencyKey: options.idempotencyKey, // to avoid duplicate payments
            });
        
        return {
            id: session.id,
            paymentUrl: session.url,
            paymentStatus: session.payment_status,
        }
    }
    
    async getSession(id: string) {
        const session = await this.stripe.checkout.sessions.retrieve(id);
        const verifiedSession: VerifiedSession = {
            id: session.id,
            paymentStatus: session.payment_status,
            metadata: session.metadata as unknown as CustomMetadata,
        };
        return verifiedSession;
    }
}