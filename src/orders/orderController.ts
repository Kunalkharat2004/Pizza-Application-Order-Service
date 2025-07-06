import { Request, Response } from "express";
import productCacheModel from "../productCache/productCacheModel";
import toppingCacheModel from "../toppingCache/toppingCacheModel";
import { ProductPricingCache } from "../productCache/productCacheTypes";
import { ToppingCache } from "../toppingCache/toppingCacheTypes";
import createHttpError from "http-errors";
import couponModel from "../coupon/couponModel";
import { CartItems, OrderEvents, OrderStatus, PaymentMode, PaymentStatus } from "./orderTypes";
import orderModel from "./orderModel";
import idempotencyModel from "../idempotency/idempotencyModel";
import mongoose from "mongoose";
import { PaymentGW } from "../payment/paymentTypes";
import { MessageBroker } from "../types/broker";
import config from "config";
import { Logger } from "winston";

export class Order {
  
  constructor(private paymentGateway: PaymentGW, private broker: MessageBroker,
    private logger: Logger
  ){}
  
  create = async (req: Request, res: Response) => {
    const totalPrice = await this.calculateTotalCartPrice(req.body.cart);

    const { cart,address, comment, customerId,paymentMode,couponCode, tenantId } = req.body;
    const discountPercentage = await this.getDiscount(couponCode, tenantId);
    const discountAmount = Math.round((totalPrice * discountPercentage) / 100);

      const totalPriceAfterDiscount = totalPrice - discountAmount;
      const TAX_PERCENTAGE = 18;
      const taxes = Math.round((totalPriceAfterDiscount * TAX_PERCENTAGE) / 100);

      const deliveryCharges = totalPrice >= 500 ? 0 : 20; // HARDCODED DELIVERY CHARGE

    const finalAmount = totalPriceAfterDiscount + taxes + deliveryCharges;

    const idempotencyKey = req.headers["idempotency-key"];
    const idempotency = await idempotencyModel.findOne({ key: idempotencyKey });

    let newOrder = idempotency ? [idempotency.response] : [];
    
    if (!idempotency) {
      const session = await mongoose.startSession();
      await session.startTransaction();

      try {
        newOrder = await orderModel.create([
          {
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
            paymentStatus: PaymentStatus.PENDING, // default to pending
            orderStatus: OrderStatus.RECEIVED, // default to received
          },
        ], { session });
        
        
        await idempotencyModel.create(
          [{ key: idempotencyKey, response: newOrder[0] }],
          { session }
        );
        
        await session.commitTransaction();
      } catch (err) {
        await session.abortTransaction();
        await session.endSession();
        console.log("Error occurred: ", err);
        throw createHttpError(500, "Failed to create order",err);
      } finally {
        await session.endSession();
      }
    }

     const brokerMessage = {
        event_type: OrderEvents.ORDER_CREATED,
        data: {...newOrder[0], customerId}
      }

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
      );
      this.logger.info("Order created and message sent to broker", { orderId: newOrder[0]._id.toString(), customerId });

      return res.json({
        paymentUrl: session.paymentUrl,
      })
    }

     await this.broker.sendMessage(
        "order",
        JSON.stringify(brokerMessage),
      );
      this.logger.info("Order created and message sent to broker", { orderId: newOrder[0]._id.toString(), customerId });

    return res.json({
      paymentUrl: null,
    })
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
}