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
      required: true,
    },
  },
  { timestamps: true },
);

idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });
idempotencySchema.index({ key: 1 }, { unique: true });

export default mongoose.model("idempotency", idempotencySchema);