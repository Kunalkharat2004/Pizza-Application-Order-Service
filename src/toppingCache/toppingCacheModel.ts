import mongoose from "mongoose";
import { ToppingCache } from "./toppingCacheTypes";

const toppingCacheSchama = new mongoose.Schema<ToppingCache>({
  toppingId: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
},
{timestamps: true}
);
toppingCacheSchama.index({ toppingId: 1 }, { unique: true });

export default mongoose.model(
  "ToppingCache",
  toppingCacheSchama,
  "toppingCache",
);