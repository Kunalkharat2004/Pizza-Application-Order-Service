export enum ProductEvents {
  PRODUCT_CREATE = "PRODUCT_CREATE",
  PRODUCT_UPDATE = "PRODUCT_UPDATE",
  PRODUCT_DELETE = "PRODUCT_DELETE",
}

export interface IPriceConfiguration {
    [key: string]: {
        priceType: "base" | "additional";
        availableOptions: {
            [option: string]: number;
        };
    };
}

export interface ProductPricingCache {
    productId: string;
    priceConfiguration: IPriceConfiguration;
}

export interface ProductMessage {
    event: ProductEvents;
    data: {
        id: string;
        priceConfiguration: IPriceConfiguration;
    }
}