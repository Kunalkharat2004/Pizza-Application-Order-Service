import orderModel from "./orderModel";
import customerModel from "../customer/customerModel";
import createHttpError from "http-errors";
import { FilterData, OrderType } from "./orderTypes";
import { IPaginateOptions } from "../types";
import { AggregatePaginateResult } from "mongoose";

export class OrderService {
  getOrdersByUserId = async (userId: string) => {
    const customerId = (await customerModel.findOne({ userId: userId }))._id;

    const orders = await orderModel.find(
      {
        customerId: customerId,
      },
      {
        cart: 0,
        address: 0,
        updatedAt: 0,
      },
    );
    // console.log("Order received: ",orders);

    if (!orders) {
      // throw new Error("No orders found for this tenant");
      return [];
    }
    return orders;
  };

  getOrder = async ({
    filters,
    paginateOptions,
  }: {
    filters: FilterData;
    paginateOptions: IPaginateOptions;
  }): Promise<AggregatePaginateResult<OrderType>> => {
    const aggregate = orderModel.aggregate([
      {
        $match: filters,
      },
        {
                $lookup: {
                    from: "customers",
                    localField: "customerId",
                    foreignField: "_id",
                    as: "customer",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                firstName: 1,
                                lastName: 1
                            },
                        },
                    ],
                },
            },
      {
        $sort: {
          createdAt: -1, // Sort by creation date in descending order
        },
      },
    ]);

    const result = orderModel.aggregatePaginate(
      aggregate,
      paginateOptions,
    );
      if (!result) {
            throw new Error("No orders found");
        }
        return result;
  };

  // GET single order service
  getSingleOrderById = async ({
    orderId,
    projection,
  }: {
    orderId: string;
    projection: {
      [key: string]: number;
    };
  }) => {
    try {
      const order = await orderModel
        .findOne(
          {
            _id: orderId,
          },
          projection,
        )
        .populate("customerId", ["firstName", "lastName"])
        .exec();

      if (!order) {
        const error = createHttpError(500, "No order found!");
        throw error;
      }

      return order;
    } catch (err) {
      const error = createHttpError(
        500,
        "Something went wrong while fetching order!",
      );
      throw error;
    }
  };

  getCustomerById = async (customerId: string) => {
    try {
      const customer = await customerModel.findOne({
        userId: customerId,
      });
      if (!customer) {
        const error = createHttpError(500, "No customer found!");
        throw error;
      }
      return customer;
    } catch (err) {
      const error = createHttpError(
        500,
        "Something went wrong while fetching customer!",
      );
      throw error;
    }
  };
}
