// model.ts
import mongoose, { AggregatePaginateModel } from "mongoose";
import dayjs from "dayjs";
import { Coupon } from "./couponTypes";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const couponSchema = new mongoose.Schema<Coupon>(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true, min: 0 },
    validTill: { type: Date, required: true },
    tenantId: { type: String, required: true },
  },
  { timestamps: true },
);

couponSchema.pre("save", function (next) {
  if (this.validTill) {
    this.validTill = dayjs(this.validTill).endOf("day").toDate();
  }
  next();
});

couponSchema.index({ code: 1, tenantId: 1 }, { unique: true });
couponSchema.plugin(aggregatePaginate);

// Here’s the key change: tell TS that this model has aggregatePaginate()
const couponModel = mongoose.model<Coupon, AggregatePaginateModel<Coupon>>(
  "Coupon",
  couponSchema,
  "coupons",
);

export default couponModel;
