import createHttpError from "http-errors";
import couponModel from "./couponModel";
import { Coupon } from "./couponTypes";

export class CouponService {
  async createCoupon({ title, code, discount, validTill, tenantId }: Coupon) {
    return await couponModel.create({
      title,
      code,
      discount,
      validTill,
      tenantId,
    });
  }

  async getCouponById(id: string) {
    return await couponModel.findById(id);
  }
  async getCouponByCodeAndTenantId({ code,tenantId}:{code: string, tenantId: string}) {
    const coupon = await couponModel.findOne({ code });
    if (!coupon) {
      throw createHttpError(404, "Invalid Coupon");
    }
    if (coupon.tenantId !== tenantId) {
      throw createHttpError(403, "Unauthorized access to this coupon");
    }
    return coupon;
  }
  
  async getAllCouponsForManager(tenantId: string) { 
    const coupons = await couponModel.find({ tenantId });
    if (!coupons || coupons.length === 0) {
      throw createHttpError(404, "No coupons found for this tenant");
    }
    return coupons;
  }

  async getAllCoupons() {
    const coupons = await couponModel.find();
    if (!coupons || coupons.length === 0) {
      throw createHttpError(404, "No coupons found");
    }
    return coupons;
  }

  async updateCoupon(
    id: string,
    { title, code, discount, validTill, tenantId }: Coupon,
  ) {
    const updatedCoupon = await couponModel.findByIdAndUpdate(
      id,
      {
        title,
        code,
        discount,
        validTill,
        tenantId,
      },
      { new: true, runValidators: true },
    );
    if (!updatedCoupon) {
      throw new Error("Coupon not found or update failed");
    }
    return updatedCoupon;
  }

  async deleteCoupon(id: string) {
    const deletedCoupon = await couponModel.findByIdAndDelete(id);
    if (!deletedCoupon) {
      throw new Error("Coupon not found or delete failed");
    }
    return deletedCoupon;
  }
}
