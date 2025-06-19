import mongoose from "mongoose";
import dayjs from "dayjs";
import { Coupon } from "./couponTypes";

const couponSchema = new mongoose.Schema<Coupon>(
  {
    title: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
    },
    validTill: {
      type: Date,
      required: true,
    },
    tenantId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure expirationDate is set to the end of the selected date (11:59:59.999 PM)
couponSchema.pre("save", function (next) {
  if (this.validTill) {
    this.validTill = dayjs(this.validTill).endOf("day").toDate();
  }
  next();
});

couponSchema.index({ code: 1, tenantId: 1 }, { unique: true });

export default mongoose.model<Coupon>("Coupon", couponSchema, "coupons");
