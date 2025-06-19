import couponModel from "./couponModel";
import { Coupon } from "./couponTypes";

export class CouponService {
    async createCoupon({title, code, discount, expirationDate, tenantId}:Coupon) {
        return await couponModel.create({title, code, discount, expirationDate, tenantId});
  }
}