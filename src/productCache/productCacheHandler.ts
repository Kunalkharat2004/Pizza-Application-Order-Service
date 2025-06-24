import productCacheModel from "./productCacheModel";
import { ProductMessage } from "./productCacheTypes";

export const handleProductUpdate = async (value:string)=>{
    try {
        const productData:ProductMessage = JSON.parse(value);
        if (!productData) return;

        return await productCacheModel.updateOne({
            productId: productData.data.id,
        }, {
            $set: {
                priceConfiguration: productData.data.priceConfiguration,
            }
        }, {
            upsert: true, // Create a new document if it doesn't exist
        })
    } catch (error) {
        console.error("Error handling product update:", error);
    }
}