import createHttpError from "http-errors";
import customerModel from "./customerModel";

type UpdateAddressProps = {
  userId: string;
  id: string;
  address: {
    label: string; // e.g. "Home" or "Work"
    text: string; // full address line
    city: string; // city name
    postalCode: string; // ZIP / PIN
    phone: string; // phone number
    isDefault: boolean;
  };
};

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

  async updateAddressService({ userId, id, address }: UpdateAddressProps) {

      // Check if the customer has permission to update the address
      const customerExists = await customerModel.exists({
        _id: id,
        userId: userId,
      });
      if (!customerExists) {
        throw createHttpError(
          403,
          "You do not have permission to update this address",
        );
      }
      //If the new address is being set as default, unset all other default addresses
      if (address.isDefault) {
        await customerModel.updateOne(
          { userId: userId },
          { $set: { "addresses.$[].isDefault": false } },
        );
      }

      // Add the new address
      const customer = await customerModel.findOneAndUpdate(
        {
          _id: id,
          userId: userId,
        },
        {
          $push: {
            addresses: {
              label: address.label || "Home",
              text: address.text,
              city: address.city,
              postalCode: address.postalCode,
              phone: address.phone,
              isDefault: address.isDefault || false,
            },
          },
        },
        {
          new: true,
          runValidators: true,
        },
    );
      if (!customer) {
        throw createHttpError(404, "Customer not found");
      }
      return customer;
  }
}
