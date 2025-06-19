import couponModel from "./couponModel";
import { Coupon } from "./couponTypes";

export class CouponService {
    async createCoupon({title, code, discount, expirationDate, tenantId}:Coupon) {
        return await couponModel.create({title, code, discount, expirationDate, tenantId});
  }

  async getCouponById(id: string) {
    return await couponModel.findById(id);
  }
  async updateCoupon(id: string, { title, code, discount, expirationDate, tenantId }: Coupon) { 

    const updatedCoupon = await couponModel.findByIdAndUpdate(
      id,
      {
        title,
        code,
        discount,
        expirationDate,
        tenantId
      },
      { new: true, runValidators: true }
    )
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

