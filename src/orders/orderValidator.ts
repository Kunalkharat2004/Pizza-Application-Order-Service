// orderValidator.ts
import { checkSchema } from "express-validator";
import { OrderStatus } from "./orderTypes";

export const orderValidator = checkSchema({
  // --- Cart array ---
  cart: {
    in: ["body"],
    isArray: {
      errorMessage: "cart must be an array of items",
    },
    notEmpty: {
      errorMessage: "cart cannot be empty",
    },
  },
  "cart.*._id": {
    in: ["body"],
    isString: {
      errorMessage: "Each cart item must have a string _id",
    },
    notEmpty: {
      errorMessage: "_id cannot be empty",
    },
  },
  "cart.*.name": {
    in: ["body"],
    isString: {
      errorMessage: "Each cart item must have a string name",
    },
    notEmpty: {
      errorMessage: "name cannot be empty",
    },
  },
  "cart.*.image": {
    in: ["body"],
    isURL: {
      errorMessage: "image must be a valid URL",
    },
  },

  // priceConfiguration is dynamic keys → just ensure it's an object
  "cart.*.priceConfiguration": {
    in: ["body"],
    custom: {
      options: (obj) =>
        obj !== null && typeof obj === "object" && !Array.isArray(obj),
      errorMessage: "priceConfiguration must be an object",
    },
  },

  // chosen configuration
  "cart.*.choosenConfiguration": {
    in: ["body"],
    custom: {
      options: (obj) =>
        obj !== null && typeof obj === "object" && !Array.isArray(obj),
      errorMessage: "choosenConfiguration must be an object",
    },
  },
  "cart.*.choosenConfiguration.priceConfiguration": {
    in: ["body"],
    custom: {
      options: (pc) =>
        pc !== null && typeof pc === "object" && !Array.isArray(pc),
      errorMessage: "choosenConfiguration.priceConfiguration must be an object",
    },
  },
  "cart.*.choosenConfiguration.priceConfiguration.*": {
    in: ["body"],
    isString: {
      errorMessage:
        "Each selected priceConfiguration value must be one of the option keys (string)",
    },
  },

  // toppings array
  "cart.*.choosenConfiguration.selectedToppings": {
    in: ["body"],
    isArray: {
      errorMessage: "selectedToppings must be an array",
    },
  },
  "cart.*.choosenConfiguration.selectedToppings.*._id": {
    in: ["body"],
    isString: {
      errorMessage: "Each topping must have a string _id",
    },
    notEmpty: {
      errorMessage: "topping _id cannot be empty",
    },
  },
  "cart.*.choosenConfiguration.selectedToppings.*.price": {
    in: ["body"],
    isNumeric: {
      errorMessage: "Each topping must have a numeric price",
    },
  },

  // quantity
  "cart.*.qty": {
    in: ["body"],
    isInt: {
      options: { min: 1 },
      errorMessage: "qty must be an integer ≥ 1",
    },
    toInt: true,
  },
  "cart.*.hash": {
    in: ["body"],
    optional: true,
    isString: {
      errorMessage: "hash, if provided, must be a string",
    },
  },

  // --- Global order fields ---
  tenantId: {
    in: ["body"],
    isString: {
      errorMessage: "tenantId must be a string",
    },
    notEmpty: {
      errorMessage: "tenantId is required",
    },
  },
  customerId: {
    in: ["body"],
    isString: {
      errorMessage: "customerId must be a string",
    },
    notEmpty: {
      errorMessage: "customerId is required",
    },
  },
  couponCode: {
    in: ["body"],
    optional: true,
    isString: {
      errorMessage: "couponCode, if provided, must be a string",
    },
  },
  comment: {
    in: ["body"],
    optional: true,
    isString: {
      errorMessage: "comment, if provided, must be a string",
    },
    isLength: {
      options: { max: 500 },
      errorMessage: "comment cannot exceed 500 characters",
    },
  },

  // paymentMode
  paymentMode: {
    in: ["body"],
    isIn: {
      options: [["card", "cod"]],
      errorMessage: "paymentMode must be either 'card' or 'cod'",
    },
  },

  // --- Address (your exact shape) ---
  address: {
    in: ["body"],
    custom: {
      options: (addr) =>
        addr !== null && typeof addr === "object" && !Array.isArray(addr),
      errorMessage: "address must be an object",
    },
  },
  "address.label": {
    in: ["body"],
    isIn: {
      options: [["Home", "Work", "Other"]],
      errorMessage: "address.label must be one of 'Home', 'Work', or 'Other'",
    },
  },
  "address.text": {
    in: ["body"],
    isString: {
      errorMessage: "address.text must be a string",
    },
    notEmpty: {
      errorMessage: "address.text is required",
    },
  },
  "address.city": {
    in: ["body"],
    isString: {
      errorMessage: "address.city must be a string",
    },
    notEmpty: {
      errorMessage: "address.city is required",
    },
  },
  "address.postalCode": {
    in: ["body"],
    isPostalCode: {
      options: "any",
      errorMessage: "address.postalCode must be a valid postal code",
    },
  },
  "address.phone": {
    in: ["body"],
    isMobilePhone: {
      options: "any",
      errorMessage: "address.phone must be a valid phone number",
    },
  },
  "address.isDefault": {
    in: ["body"],
    isBoolean: {
      errorMessage: "address.isDefault must be a boolean",
    },
    toBoolean: true,
  },
});

export const orderStatusValidator = checkSchema({
  status:{
    in:["body"],
    notEmpty:{
      errorMessage: "Status is required!"
    },
    custom:{
      options: (status)=> {
        const validStatuses = Object.values(OrderStatus);
        if (!validStatuses.includes(status)) {
          throw new Error("Invalid status value!");
        }
        return true;
      }
    }
  }
})