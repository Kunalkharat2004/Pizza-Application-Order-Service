import mongoose from "mongoose";
import { CartItems, OrderType, OrderStatus, PaymentMode, PaymentStatus, Topping } from "./orderTypes";
import { addressSchema } from "../customer/customerModel";

const toppingSchema = new mongoose.Schema<Topping>({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
});

const cartSchema = new mongoose.Schema<CartItems>({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    qty: {
      type: Number,
      required: true,  
    },
    priceConfiguration: {
        type: Map,
        of: {
            priceType: {
                type: String,
                enum: ["base", "additional"],
                required: true
            },
            availableOptions: {
                type: Map,
                of: Number,
                required: true
            }
        }
    },
    choosenConfiguration: {
        priceConfiguration: {
            type: Map,
            of: String,
            required: true
        },
        selectedToppings: {
            type: [toppingSchema],
            required: true
        }
    }
});

const orderSchema = new mongoose.Schema<OrderType>({
  cart: {
    type: [cartSchema],
    required: true,
  },
  address: {
    type: addressSchema,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  comment: {
    type: String,
    default: null,
  },
  tenantId: {
    type: String,
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  deliveryCharges: {
    type: Number,
    default: 0,
  },
  orderStatus: {
    type: String,
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  },
  paymentMode: {
    type: String,
    enum: PaymentMode,
  },
  paymentId: {
    type: String,
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    },
    taxes: {
        type: Number,
        default: 0,
    }
});

export default mongoose.model<OrderType>("Order", orderSchema);