export interface IAttributeConfiguration {
  name: string;
  widgetType: "radio" | "switch";
  defaultValue: string;
  availableOptions: Array<string>;
}

export interface IProductPriceConfiguration {
  [key: string]: {
    priceType: "base" | "additional";
    availableOptions: {
      [key: string]: number;
    };
  };
}
export interface IPriceConfiguration {
  [key: string]: {
    priceType: "base" | "additional";
    availableOptions: Array<string>;
  };
}

export interface ICategory {
  _id: string;
  name: string;
  priceConfiguration: IPriceConfiguration;
  attributeConfiguration: Array<IAttributeConfiguration>;
  hasToppings: boolean;
}

export interface IAttributeConfigurationValue {
  name: string;
  value: string;
}

export interface Product {
  _id: string;
  name: string;
  image: string;
  description: string;
  category: ICategory;
  isPublished: boolean;
  tenantId: string;
  categoryId: string;
  priceConfiguration: IProductPriceConfiguration;
  attributeConfiguration: Array<IAttributeConfigurationValue>;
}

export type Topping = {
  _id: string;
  name: string;
  price: number;
  image: string;
  tenantId: string;
  isPublished: boolean;
  createdAt: Date;
};

export interface CartItems
  extends Pick<Product, "_id" | "name" | "image" | "priceConfiguration"> {
  choosenConfiguration: {
    priceConfiguration: {
      [key: string]: string;
    };
    selectedToppings: Topping[];
  };
  qty: number;
  hash?: string;
}
