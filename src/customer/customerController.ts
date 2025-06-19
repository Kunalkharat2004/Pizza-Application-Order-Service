import {Response} from "express";
import { Request } from "express-jwt";
import { Logger } from "winston";
import { CustomerService } from "./customerService";
import createHttpError from "http-errors";


export class Customer {
  constructor(
    private readonly customerService: CustomerService,
    private readonly logger: Logger,
  ) {}

  getCustomer = async (req: Request, res: Response) => {
    const { sub: userId, firstName, lastName, email } = req.auth;

    this.logger.info("Customer Info", {
      userId,
      firstName,
      lastName,
      email,
    });

    const customer = await this.customerService.getCustomerService({
      userId,
      firstName,
      lastName,
      email,
    });
    if (!customer) {
      throw createHttpError(500, "Failed to retrieve customer data");
    }

    this.logger.info("Customer retrieved successfully", customer._id);
    res.status(201).json(customer);
  };

  updateAddress = async (req: Request, res: Response) => {
    
    const { sub: userId } = req.auth;
    const { id } = req.params;
    const { address } = req.body;
    this.logger.info("Updating address for customer", {
      userId,
      address,
    });
    const updatedCustomer = await this.customerService.updateAddressService({userId, id, address});

    if (!updatedCustomer) {
      throw createHttpError(500, "Failed to update address");
    }

    this.logger.info("Address updated successfully", updatedCustomer._id);
    res.status(200).json(updatedCustomer);
  }
}