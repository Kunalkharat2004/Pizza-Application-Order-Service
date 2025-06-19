import mongoose from "mongoose";
import { Address, Customer } from "./customerTypes";

const addressSchema = new mongoose.Schema<Address>({
    text: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    _id: false
})

const customerSchema = new mongoose.Schema<Customer>({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    addresses: [addressSchema],

}, {timestamps: true})

export default mongoose.model<Customer>("Customer", customerSchema, "customers");