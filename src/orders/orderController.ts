import { Request, Response } from "express";
import { CartItems } from "./OrderTypes";
import productCacheModel from "../productCache/productCacheModel";
import toppingCacheModel from "../toppingCache/toppingCacheModel";
import { ProductPricingCache } from "../productCache/productCacheTypes";
import { ToppingCache } from "../toppingCache/toppingCacheTypes";
import createHttpError from "http-errors";
import couponModel from "../coupon/couponModel";

export class Order {
  create = async (req: Request, res: Response) => {
    console.log(req.body.cart);
    const totalPrice = await this.calculateTotalCartPrice(req.body.cart);
    console.log("Total price: ", totalPrice);

    const { couponCode, tenantId } = req.body;
    const discountPercentage = await this.getDiscount(couponCode, tenantId);
      const discountAmount = Math.round((totalPrice * discountPercentage) / 100);
      
    res.json({ totalPrice, discountAmount });
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