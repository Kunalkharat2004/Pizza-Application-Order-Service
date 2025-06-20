// validators/customerAddressValidator.ts

import { checkSchema } from "express-validator";

export const customerAddressValidator = checkSchema({
  addresses: {
    in: ["body"],
    optional: { options: { nullable: true } },
    isArray: {
      errorMessage: "addresses must be an array",
    },
  },

  // --- Per‑address validators ---
  "addresses.*.label": {
    in: ["body"],
    isString: {
      errorMessage: "Address label must be a string",
    },
    isIn: {
      options: [["Home", "Work", "Other"]],
      errorMessage: "label must be one of Home, Work or Other",
    },
    notEmpty: {
      errorMessage: "Address label is required",
    },
  },
  "addresses.*.text": {
    in: ["body"],
    isString: {
      errorMessage: "Address text must be a string",
    },
    notEmpty: {
      errorMessage: "Address text is required",
    },
    trim: true,
  },
  "addresses.*.city": {
    in: ["body"],
    isString: {
      errorMessage: "City must be a string",
    },
    notEmpty: {
      errorMessage: "City is required",
    },
    trim: true,
  },
  "addresses.*.postalCode": {
    in: ["body"],
    isString: {
      errorMessage: "Postal code must be a string",
    },
    notEmpty: {
      errorMessage: "Postal code is required",
    },
    trim: true,
  },
  "addresses.*.phone": {
    in: ["body"],
    isString: {
      errorMessage: "Phone must be a string",
    },
    notEmpty: {
      errorMessage: "Phone number is required",
    },
    trim: true,
    matches: {
      options: [/^[0-9+\-()\s]+$/],
      errorMessage: "Invalid phone number",
    },
  },
  "addresses.*.isDefault": {
    in: ["body"],
    optional: true,
    isBoolean: {
      errorMessage: "isDefault must be a boolean",
    },
    toBoolean: true,
  },
});
