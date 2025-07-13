import orderModel from "./orderModel";
import customerModel from "../customer/customerModel";

export class OrderService {
  getOrdersByTenant = async ({
    userId,
    restaurantId,
  }: {
    userId: string;
    restaurantId: string;
  }) => {

    const customerId = (await customerModel.findOne({userId: userId}))._id;

    const orders = await orderModel.find({
      tenantId: String(restaurantId),
      customerId: customerId
    },);
    // console.log("Order received: ",orders);

    if (!orders) {
      throw new Error("No orders found for this tenant");
    }
    return orders;
  };
}
