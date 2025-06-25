import mongoose from "mongoose";
import { Address, Customer } from "./customerTypes";

export const addressSchema = new mongoose.Schema<Address>(
  {
    label: {
      type: String,
      required: true,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
);

const customerSchema = new mongoose.Schema<Customer>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model<Customer>(
  "Customer",
  customerSchema,
  "customers",
);
