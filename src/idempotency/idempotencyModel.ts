import mongoose from "mongoose";
import { Order } from "../orders/orderTypes";

interface Idempotency {
  key: string;
  response: Order;
}

const idempotencySchema = new mongoose.Schema<Idempotency>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    response: {
      type: Object,
      require: true,
    },
  },
  { timestamps: true },
);

idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 20 });
idempotencySchema.index({ key: 1 }, { unique: true });

export default mongoose.model("idempotency", idempotencySchema);