import mongoose from "mongoose";
import { Coupon } from "./couponTypes";

const couponSchema = new mongoose.Schema<Coupon>({
    title: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    discount: {
        type: Number,
        required: true,
        min: 0
    },
    expirationDate: {
        type: Date,
        required: true
    },
    tenantId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

export default mongoose.model<Coupon>("Coupon", couponSchema, "coupons");