import { Response, Request, NextFunction } from "express";
import { Request as AuthRequest } from "express-jwt";
import productCacheModel from "../productCache/productCacheModel";
import toppingCacheModel from "../toppingCache/toppingCacheModel";
import { ProductPricingCache } from "../productCache/productCacheTypes";
import { ToppingCache } from "../toppingCache/toppingCacheTypes";
import createHttpError from "http-errors";
import couponModel from "../coupon/couponModel";
import {
  CartItems,
  FilterData,
  OrderEvents,
  OrderStatus,
  OrderType,
  PaymentMode,
  PaymentStatus,
} from "./orderTypes";
import orderModel from "./orderModel";
import idempotencyModel from "../idempotency/idempotencyModel";
import mongoose from "mongoose";
import { PaymentGW } from "../payment/paymentTypes";
import { MessageBroker } from "../types/broker";
import { Logger } from "winston";

import { OrderService } from "./orderService";
import { ROLES } from "../common/constants";
import { customPaginateLabels } from "../config/customPaginateLabels";
import customerModel from "../customer/customerModel";

export class Order {
  constructor(
    private paymentGateway: PaymentGW,
    private broker: MessageBroker,
    private orderService: OrderService,
    private logger: Logger,
  ) {}

  create = async (req: Request, res: Response) => {
    try {
      const totalPrice = await this.calculateTotalCartPrice(req.body.cart);
      console.log("Total price:", totalPrice);

      const {
        cart,
        address,
        comment,
        customerId,
        paymentMode,
        couponCode,
        tenantId,
      } = req.body;
      let discountPercentage = 0;
      if (couponCode) {
        discountPercentage = await this.getDiscount(couponCode, tenantId);
        console.log("Discount percentage:", discountPercentage);
      }
      const discountAmount = Math.round(
        (totalPrice * discountPercentage) / 100,
      );

      const totalPriceAfterDiscount = totalPrice - discountAmount;
      const TAX_PERCENTAGE = 18;
      const taxes = Math.round(
        (totalPriceAfterDiscount * TAX_PERCENTAGE) / 100,
      );

      const deliveryCharges = totalPrice >= 500 ? 0 : 20; // HARDCODED DELIVERY CHARGE

      const finalAmount = totalPriceAfterDiscount + taxes + deliveryCharges;

      const idempotencyKey = req.headers["idempotency-key"];
      const idempotency = await idempotencyModel.findOne({
        key: idempotencyKey,
      });
      console.log("Idempotency key:", idempotencyKey, "Exists:", !!idempotency);

      let newOrder: OrderType[] = [];

      if (idempotency) {
        // If idempotency exists, use the stored response directly. It's already a plain object.
        newOrder = [idempotency.response];
      }

      if (!idempotency) {
        const session = await mongoose.startSession();
        await session.startTransaction();

        console.log("data:", {
          cart,
          address,
          comment,
          customerId,
          total: finalAmount,
          discount: discountAmount,
          taxes,
          deliveryCharges,
          tenantId,
          paymentMode,
        });

        try {
          const customer = await customerModel.findById(customerId).lean();
          const createdOrdersDocs = await orderModel.create(
            [
              {
                cart,
                address,
                comment,
                customerId,
                customer,
                total: finalAmount,
                discount: discountAmount,
                taxes,
                deliveryCharges,
                tenantId,
                paymentMode,
                paymentStatus: PaymentStatus.PENDING, // default to pending
                orderStatus: OrderStatus.RECEIVED, // default to received
              },
            ],
            { session },
          );

          newOrder = [createdOrdersDocs[0]]; // Assign the plain object to newOrder
          await idempotencyModel.create(
            [{ key: idempotencyKey, response: newOrder[0] }],
            { session },
          );

          await session.commitTransaction();
        } catch (err) {
          console.error("Transaction error:", err);
          await session.abortTransaction();
          await session.endSession();
          console.log("Error occurred: ", err);
          throw createHttpError(500, "Failed to create order", err);
        } finally {
          await session.endSession();
        }
      }

  const customer = await customerModel
    .findOne({ _id: newOrder[0].customerId })
    .select("firstName lastName email");


      const brokerMessage = {
        event_type: OrderEvents.ORDER_CREATED,
        data: { ...newOrder[0], customerId: customer },
      };

      // Payment processing
      if (paymentMode === PaymentMode.CARD) {
        const session = await this.paymentGateway.createSession({
          amount: finalAmount,
          orderId: newOrder[0]._id.toString(),
          tenantId: newOrder[0].tenantId,
          idempotencyKey: idempotencyKey as string,
        });

        await this.broker.sendMessage(
          "order",
          JSON.stringify(brokerMessage),
          newOrder[0]._id.toString(),
        );
        this.logger.info("Order created and message sent to broker", {
          orderId: newOrder[0]._id.toString(),
          customerId,
        });

        return res.json({
          paymentUrl: session.paymentUrl,
        });
      }

      await this.broker.sendMessage(
        "order",
        JSON.stringify(brokerMessage),
        newOrder[0]._id.toString(),
      );
      this.logger.info("Order created and message sent to broker", {
        orderId: newOrder[0]._id.toString(),
        customerId,
      });

      return res.json({
        paymentUrl: null,
      });
    } catch (err) {
      console.error("⚠️ create(order) failed:", err);
      return res
        .status(err.status || 500)
        .json({ errors: [{ msg: err.message, stack: err.stack }] });
    }
  };

  private calculateTotalCartPrice = async (cart: CartItems[]) => {
    // pull all product- and topping-IDs
    const productIds = cart.map((item) => item._id);
    const toppingIds = cart.flatMap((item) =>
      item.choosenConfiguration.selectedToppings.map((t) => t._id),
    );

    // fetch caches
    const [productCache, toppingsCache] = await Promise.all([
      productCacheModel.find({ productId: { $in: productIds } }),
      toppingCacheModel.find({ toppingId: { $in: toppingIds } }),
    ]);

    // turn into fast lookup maps
    const prodMap = new Map(productCache.map((p) => [p.productId, p]));
    const topMap = new Map(toppingsCache.map((t) => [t.toppingId, t]));

    // reduce over cart
    const totalPrice = cart.reduce((grandTotal, item) => {
      const cacheProduct = prodMap.get(item._id);
      if (!cacheProduct) {
        throw createHttpError(400, `No price cache for product ${item._id}`);
      }

      // compute one‐unit total
      const oneUnitTotal = this.getItemTotal(item, cacheProduct, topMap);
      return grandTotal + item.qty * oneUnitTotal;
    }, 0);

    return totalPrice;
  };

  private getItemTotal(
    item: CartItems,
    cacheProduct: ProductPricingCache,
    toppingMap: Map<string, ToppingCache>,
  ): number {
    // toppings
    const toppingsTotal = item.choosenConfiguration.selectedToppings.reduce(
      (sum, t) => {
        const cacheT = toppingMap.get(t._id);
        if (!cacheT) {
          throw createHttpError(400, `No topping cache for ${t._id}`);
        }
        return sum + cacheT.price;
      },
      0,
    );

    // product options
    const productTotal = Object.entries(
      item.choosenConfiguration.priceConfiguration,
    ).reduce((sum, [optionName, choice]) => {
      const configSchema = cacheProduct.priceConfiguration[optionName];
      if (!configSchema) {
        throw createHttpError(
          400,
          `No cached configuration for option "${optionName}" on product ${item._id}`,
        );
      }
      const optionPrice = configSchema.availableOptions[choice];
      if (optionPrice == null) {
        throw createHttpError(
          400,
          `"${choice}" is not a valid option for "${optionName}" on ${item._id}`,
        );
      }
      return sum + optionPrice;
    }, 0);

    return toppingsTotal + productTotal;
  }

  private async getDiscount(code: string, tenantId: string): Promise<number> {
    if (!code || !tenantId) return 0;

    // find a coupon that matches code + tenantId AND is not expired
    const coupon = await couponModel
      .findOne(
        {
          code,
          tenantId,
          validTill: { $gte: new Date() },
        },
        { discount: 1, _id: 0 }, // only fetch discount
      )
      .lean();

    // if no coupon or no discount field → 0
    return coupon?.discount ?? 0;
  }

  getOrders = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.auth?.sub;
      const paginateOptions = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        customLabels: customPaginateLabels,
      };

      const orders = await this.orderService.getOrdersByUserId({
        userId,
        paginateOptions,
      });
      return res.json(orders);
    } catch (err) {
      console.error("⚠️ getOrdersByTenant failed:", err);
      const error = createHttpError(500, "Failed to fetch orders", err);
      throw error;
    }
  };

  getAllOrders = async (req: AuthRequest, res: Response) => {
    try {
      const { tenantId, orderStatus, paymentMode, paymentStatus } = req.query;
      const managerTenantId = req.auth?.tenantId;

      const filters: FilterData = {};
      if (tenantId || managerTenantId)
        filters.tenantId = (tenantId as string) || (managerTenantId as string);
      if (orderStatus) filters.orderStatus = orderStatus as string;
      if (paymentMode) filters.paymentMode = paymentMode as string;
      if (paymentStatus) filters.paymentStatus = paymentStatus as string;

      const paginateOptions = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
        customLabels: customPaginateLabels,
      };

      // check if role is ADMIN
      const isAdmin = req.auth?.role === ROLES.ADMIN;
      if (isAdmin) {
        const order = await this.orderService.getOrder({
          filters,
          paginateOptions,
        });
        return res.json(order);
      }

      // check if role is MANAGER
      const isManager = req.auth?.role === ROLES.MANAGER;
      if (isManager) {
        const order = await this.orderService.getOrder({
          filters,
          paginateOptions,
        });
        return res.json(order);
      }

      // if role is customer
      throw createHttpError(
        403,
        "You are not authorize to access these resource.",
      );
    } catch (err) {
      const error = createHttpError(500, "Failed to load orders");
      throw error;
    }
  };

  getSingleOrder = async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.params;
      const fields = req.query.fields
        ? req.query.fields.toString().split(",")
        : [];

      const projection = fields.reduce(
        (acc, field) => {
          acc[field] = 1;
          return acc;
        },
        { customerId: 1 },
      );

      const order = await this.orderService.getSingleOrderById({
        orderId,
        projection,
      });

      // check if the role is admin
      const isAdmin = req.auth.role === ROLES.ADMIN;
      if (isAdmin) {
        return res.json(order);
      }

      // check if the role is manager
      const isManager = req.auth.role === ROLES.MANAGER;
      const managerTenantId = req.auth?.tenantId;

      if (isManager && managerTenantId === order.tenantId) {
        return res.json(order);
      }

      // check if the role is customer
      const isCustomer = req.auth.role === ROLES.CUSTOMER;
      if (isCustomer) {
        const userId = req.auth?.sub;
        const customer = await this.orderService.getCustomerById(userId);
        if (customer._id.toString() === order.customerId._id.toString()) {
          return res.json(order);
        }
      }

      const error = createHttpError(
        403,
        "You are not authorize to access this resource.",
      );
      throw error;
    } catch (err) {
      const error = createHttpError(500, "Failed to fetch single order");
      throw error;
    }
  };

  updateOrderStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { orderId } = req.params;
      const { role, tenantId } = req.auth;
      const { status } = req.body;

      const fields = req.query.fields
        ? req.query.fields.toString().split(",")
        : [];

      const projection = fields.reduce(
        (acc, field) => {
          acc[field] = 1;
          return acc;
        },
        { customerId: 1 },
      );

      if (role === ROLES.ADMIN || role === ROLES.MANAGER) {
        const order = await this.orderService.getSingleOrderById({
          orderId,
          projection,
        });

        // for manager check if allowed to modify
        if (role === ROLES.MANAGER) {
          const isMyRestaurant = tenantId === order.tenantId;
          if (!isMyRestaurant) {
            return next(createHttpError(403, "Not allowed."));
          }
        }

        const updatedOrder = await this.orderService.updateOrderStatus({
          orderId,
          status,
        });

        // publish message to kafka
        const brokerMessage = {
          event_type: OrderEvents.ORDER_UPDATED,
          data: { ...updatedOrder.toObject() },
        };

        await this.broker.sendMessage(
          "order",
          JSON.stringify(brokerMessage),
          updatedOrder._id.toString(),
        );
        this.logger.info("Order created and message sent to broker", {
          orderId: updatedOrder._id.toString(),
        });

        return res.json({ _id: updatedOrder._id });
      }

      return next(createHttpError(403, "Not allowed."));
    } catch (err) {
      throw createHttpError(500, "Failed to update status!");
    }
  };
}
