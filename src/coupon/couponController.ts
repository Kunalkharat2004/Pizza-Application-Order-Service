import { Response } from "express";
import { Logger } from "winston";
import { CouponService } from "./couponService";
import { Request } from "express-jwt";
import createHttpError from "http-errors";
import { ROLES } from "../common/constants";

export class Coupon {
  constructor(
    private readonly couponService: CouponService,
    private readonly logger: Logger,
  ) {}

  create = async (req: Request, res: Response) => {
    const { title, code, discount, validTill } = req.body;
    const tenantId = req.auth?.tenantId;

    this.logger.info("Creating coupon", {
      title,
      code,
      discount,
      validTill,
      tenantId,
    });

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
}
