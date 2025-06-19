import createHttpError from "http-errors";
import customerModel from "./customerModel";

type UpdateAddressProps = {
  userId: string;
  id: string;
  address: {
    text: string;
    isDefault?: boolean;
  };
}

export class CustomerService {
  async getCustomerService({ userId, firstName, lastName, email }) {
    if (!userId || !firstName || !lastName || !email) {
      throw createHttpError(400, "Invalid user data");
    }
    const customer = await customerModel.findOne({ userId });
    if (!customer) {
      const newCustomer = await customerModel.create({
        userId,
        firstName,
        lastName,
        email,
      });
      return newCustomer;
    }
    return customer;
  }

  async updateAddressService({ userId, id, address }:UpdateAddressProps) {

    if(!userId || !id || !address || !address.text) {
      throw createHttpError(400, "Invalid input data");
    }

    // Check if the customer has permission to update the address
    const customerExists = await customerModel.exists({ _id: id, userId: userId });
    if (!customerExists) {
      throw createHttpError(403, "You do not have permission to update this address");
    }

    const customer = await customerModel.findOneAndUpdate({
      _id: id,
      userId: userId
    }, {
      $push: {
        addresses: {
          text: address.text,
          isDefault: address.isDefault || false
        }
      }
    }, {
      new: true,
      runValidators: true,
    })

    return customer;
  }
}