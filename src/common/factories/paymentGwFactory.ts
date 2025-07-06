import { PaymentGW } from "../../payment/paymentTypes";
import { StripeGateway } from "../../payment/stripe";

let paymentGateway: PaymentGW | null = null;

const createPaymentGateway = () =>{
    if(!paymentGateway){
        paymentGateway = new StripeGateway();
    }
    return paymentGateway;
}

export default createPaymentGateway;