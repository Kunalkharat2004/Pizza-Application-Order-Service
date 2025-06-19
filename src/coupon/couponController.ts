import { Response } from "express";
import { Logger } from "winston";
import { CouponService } from "./couponService";
import { Request } from "express-jwt";
import createHttpError from "http-errors";

export class Coupon {
    constructor(
        private readonly couponService: CouponService,
        private readonly logger: Logger,
    ) { }
    
    create = async (req: Request, res: Response) => {
        const { title, code, discount, expirationDate } = req.body;
        const tenantId = req.auth?.tenantId;

        this.logger.info("Creating coupon", {
            title,
            code,
            discount,
            expirationDate,
            tenantId
        })

        const coupon = await this.couponService.createCoupon({
            title,
            code,
            discount,
            expirationDate,
            tenantId
        })
        if (!coupon) {
            this.logger.error("Failed to create coupon");
            throw createHttpError(500, "Failed to create coupon");
        }
        this.logger.info("Coupon created successfully", coupon._id);
        res.status(201).json(coupon);
    }
}