import orderModel from "./orderModel";
import customerModel from "../customer/customerModel";
import createHttpError from "http-errors";
import { FilterData, OrderType } from "./orderTypes";
import { IPaginateOptions } from "../types";
import { AggregatePaginateResult } from "mongoose";

export class OrderService {
  getOrdersByUserId = async ({
    userId,
    paginateOptions,
  }: {
    userId: string;
    paginateOptions: IPaginateOptions;
  }): Promise<AggregatePaginateResult<OrderType>> => {
    const customerId = (await customerModel.findOne({ userId: userId }))._id;

    const aggregate = orderModel.aggregate([
      {
        $match: { customerId },
      },
      {
        $project: {
          cart: 0,
          address: 0,
          updatedAt: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    const result = orderModel.aggregatePaginate(aggregate, paginateOptions);
    console.log("Order aggregate: ", result);
    if (!result) {
      throw new Error("No orders found");
    }
    return result;
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
          as: "customerId",
          pipeline: [
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
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
      {
        $unwind: "$customerId", // Unwind the customerId array to get a single object
      }
    ]);

    const result = orderModel.aggregatePaginate(aggregate, paginateOptions);
    if (!result) {
      throw new Error("No orders found");
    }
    return result;
  };


getOrderForDashBoard = async ({
  filters,
  paginateOptions,
}: {
  filters: FilterData;
  paginateOptions: IPaginateOptions;
}): Promise<{ orders: AggregatePaginateResult<OrderType>, totalSales: number, avgOrderPrice: number }> => {
  
  // 1️⃣ Calculate total sales & average order price
 const salesStats = await orderModel.aggregate([
  { $match: filters },
  {
    $group: {
      _id: null,
      totalSales: { $sum: "$total" },
      avgOrderPrice: { $avg: "$total" }
    }
  },
  {
    $project: {
      _id: 0,
      totalSales: 1,
      avgOrderPrice: { $round: ["$avgOrderPrice", 2] } // ⬅ round to 2 decimals
    }
  }
]);

  const totalSales = salesStats.length > 0 ? salesStats[0].totalSales : 0;
  const avgOrderPrice = salesStats.length > 0 ? salesStats[0].avgOrderPrice : 0;
  console.log("Total Sales: ", totalSales, "Avg Order Price: ", avgOrderPrice);

  // 2️⃣ Get paginated orders
  const aggregate = orderModel.aggregate([
    { $match: filters },
    {
      $lookup: {
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customerId",
        pipeline: [
          { $project: { _id: 1, firstName: 1, lastName: 1, email: 1 } }
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    { $unwind: "$customerId" }
  ]);

  const orders = await orderModel.aggregatePaginate(aggregate, paginateOptions);

  return { orders, totalSales, avgOrderPrice };
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
        .populate("customerId", ["firstName", "lastName", "email"])
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

  updateOrderStatus = async ({
    orderId,
    status,
  }: {
    orderId: string;
    status: string;
  }) => {
    try {
      const updatedOrder = orderModel.findOneAndUpdate(
        { _id: orderId },
        { orderStatus: status },
        { new: true },
      );

      if(!updatedOrder){
      throw createHttpError("500", "Error updating order status!");
      }

      return updatedOrder;
    } catch (err) {
      throw createHttpError("500", "Error updating order status!");
    }
  };
}
