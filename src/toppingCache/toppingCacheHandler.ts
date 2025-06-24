import toppingCacheModel from "./toppingCacheModel";
import { ToppingMessage } from "./toppingCacheTypes";

export const handleToppingUpdate = async(value: string) => {
    try {
        const toppingData:ToppingMessage = JSON.parse(value);
        if (!toppingData) return;

        return await toppingCacheModel.updateOne({
            toppingId: toppingData.data.id,
        }, {
            $set: {
                price: toppingData.data.price,
            }
        }, {
            upsert: true, // Create a new document if it doesn't exist
        })
    } catch (error) {
        console.error("Error handling topping update:", error);
    }
}