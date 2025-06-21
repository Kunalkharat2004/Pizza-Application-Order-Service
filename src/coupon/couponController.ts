import { Response } from "express";
import { Logger } from "winston";
import { CouponService } from "./couponService";
import { Request } from "express-jwt";
import createHttpError from "http-errors";
import { ROLES } from "../common/constants";
import { Coupon, FilterData } from "./couponTypes";
import { customPaginateLabels } from "../config/customPaginateLabels";
import { AggregatePaginateResult } from "mongoose";

export class CouponController {
  constructor(
    private readonly couponService: CouponService,
    private readonly logger: Logger,
  ) {}

  create = async (req: Request, res: Response) => {
    const { title, code, discount, validTill } = req.body;

    const tenantId = req.body.tenantId || req.auth?.tenantId;

    const coupon = await this.couponService.createCoupon({
      title,
      code,
      discount,
      validTill,
      tenantId,
    });
    if (!coupon) {
      this.logger.error("Failed to create coupon");
      throw createHttpError(500, "Failed to create coupon");
    }
    this.logger.info("Coupon created successfully", coupon._id);
    res.status(201).json(coupon);
  };

  getAll = async (req: Request, res: Response) => {
    const { q = "", restaurantId, discount } = req.query;
    const filters: FilterData = {};

    if (restaurantId) filters.restaurantId = String(restaurantId);
    if (discount) filters.discount = parseFloat(String(discount));

    const paginateOptions = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      customLabels: customPaginateLabels,
    };

    const tenantId = req.auth?.tenantId;
    let pagedResult: AggregatePaginateResult<Coupon>;

    if (req.auth?.role !== ROLES.ADMIN) {
      this.logger.info(
        "Fetching paginated coupons for tenant with search/filters",
        { tenantId, q, filters },
      );
      pagedResult = await this.couponService.getAllCouponsForManager(
        tenantId,
        String(q),
        filters,
        paginateOptions,
      );
    } else {
      this.logger.info(
        "Fetching paginated coupons for admin with search/filters",
      );
      pagedResult = await this.couponService.getAllCoupons(
        String(q),
        filters,
        paginateOptions,
      );
    }

    return res.json(pagedResult);
  };

  update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, code, discount, validTill } = req.body;
    const tenantId = req.auth?.tenantId;

    if (req.auth?.role !== ROLES.ADMIN) {
      const couponExists = await this.couponService.getCouponById(id);
      if (!couponExists) {
        this.logger.error("Coupon not found", { id, tenantId });
        throw createHttpError(404, "Coupon not found");
      } else if (tenantId !== couponExists.tenantId) {
        this.logger.error("Unauthorized access to coupon", { id, tenantId });
        throw createHttpError(403, "Unauthorized access to this coupon");
      }
    }
    this.logger.info("Updating coupon", {
      id,
      title,
      code,
      discount,
      validTill,
      tenantId,
    });
    const updatedCoupon = await this.couponService.updateCoupon(id, {
      title,
      code,
      discount,
      validTill,
      tenantId,
    });

    return res.json(updatedCoupon);
  };

  delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;

    this.logger.info("Deleting coupon", { id, tenantId });

    const couponExists = await this.couponService.getCouponById(id);
    if (!couponExists) {
      this.logger.error("Coupon not found", { id, tenantId });
      throw createHttpError(404, "Coupon not found");
    }

    if (req.auth?.role !== ROLES.ADMIN) {
      if (tenantId !== couponExists.tenantId) {
        this.logger.error("Unauthorized access to coupon", { id, tenantId });
        throw createHttpError(403, "Unauthorized access to this coupon");
      }
    }

    await this.couponService.deleteCoupon(id);

    return res.json({});
  };

  verifyCoupon = async (req: Request, res: Response) => {
    const { code, tenantId } = req.body;
    this.logger.info("Verifying coupon", { code, tenantId });

    const coupon = await this.couponService.getCouponByCodeAndTenantId({
      code,
      tenantId,
    });
    if (new Date(coupon.validTill) < new Date()) {
      this.logger.error("Coupon has expired", { code, tenantId });
      return res.json({
        valid: false,
        exp: true,
        discount: 0,
      });
    }
    this.logger.info("Coupon verified successfully", coupon._id);

    return res.json({
      valid: true,
      exp: false,
      discount: coupon.discount,
    });
  };
}
