import createHttpError from "http-errors";
import customerModel from "./customerModel";

export class CustomerService {
  async getCustomerService({
    userId,
    firstName,
    lastName,
    email,
  }) {
    if (!userId || !firstName || !lastName || !email) {
      throw createHttpError(400, "Invalid user data");
      }
      const customer = await customerModel.findOne({userId});
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
}