/* eslint-disable @typescript-eslint/no-explicit-any */
import createHttpError from "http-errors";
import couponModel from "./couponModel";
import { Coupon, FilterData } from "./couponTypes";
import { IPaginateOptions } from "../types";
import { AggregatePaginateResult } from "mongoose";

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
  async getCouponByCodeAndTenantId({
    code,
    tenantId,
  }: {
    code: string;
    tenantId: string;
  }) {
    const coupon = await couponModel.findOne({ code });
    if (!coupon) {
      throw createHttpError(404, "Invalid Coupon");
    }
    if (coupon.tenantId !== tenantId) {
      throw createHttpError(403, "Unauthorized access to this coupon");
    }
    return coupon;
  }

  async getAllCouponsForManager(
    tenantId: string,
    q: string,
    filtersData: FilterData,
    paginateOptions: IPaginateOptions,
  ): Promise<AggregatePaginateResult<Coupon>> {
    // Build your match
    const match: Record<string, any> = { tenantId };

    if (typeof filtersData.discount === "number") {
      match.discount = filtersData.discount;
    }

    if (q) {
      match.title = { $regex: q, $options: "i" };
    }

    const aggregate = couponModel.aggregate([{ $match: match }]);
    const result = await couponModel.aggregatePaginate(
      aggregate,
      paginateOptions,
    );

    if (!result) {
      throw createHttpError(404, "No coupons found for this tenant");
    }

    return result;
  }

  async getAllCoupons(
    q: string,
    filtersData: FilterData,
    paginateOptions: IPaginateOptions,
  ) {
    const match: Record<string, any> = {};

    if (filtersData.restaurantId) {
      match.tenantId = filtersData.restaurantId;
    }
    // if they passed a discount filter
    if (typeof filtersData.discount === "number") {
      match.discount = filtersData.discount;
    }

    // only add a title‐regex if q is truthy
    if (q) {
      match.title = { $regex: q, $options: "i" };
    }

    const aggregate = couponModel.aggregate([{ $match: match },{ $sort: { createdAt: -1 } }]);  

    const result = await couponModel.aggregatePaginate(
      aggregate,
      paginateOptions,
    );
    if (!result) {
      throw new Error("No coupons found");
    }
    return result;
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
