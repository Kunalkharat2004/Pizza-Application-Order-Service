import { Router } from "express";
import { Customer } from "./customerController";
import authenticate from "../common/middleware/authenticate";
import logger from "../config/logger";
import { CustomerService } from "./customerService";
import { asyncWrapper } from "../utils";
const router = Router();

const customerService = new CustomerService();
const customerController = new Customer(customerService, logger);

router.get("/", authenticate, asyncWrapper(customerController.getCustomer));

export default router;
