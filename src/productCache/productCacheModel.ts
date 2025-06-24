import mongoose from "mongoose";
import { ProductPricingCache } from "./productCacheTypes";

const priceConfigurationSchema = new mongoose.Schema({
  priceType: {
    type: String,
    enum: ["base", "additional"],
  },
  availableOptions: {
    type: Object,
    of: Number,
  },
});

const productCacheSchema = new mongoose.Schema<ProductPricingCache>({
  productId: {
    type: String,
    required: true,
    unique: true,
  },
  priceConfiguration: {
    type: Object,
    of: priceConfigurationSchema,
  },
});

export default mongoose.model("ProductCache", productCacheSchema, "productCache");