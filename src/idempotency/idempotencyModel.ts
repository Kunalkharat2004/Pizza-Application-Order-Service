import mongoose from "mongoose";

const idempotencySchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    response: {
        type: Object,
        require: true
    },
}, { timestamps: true });

idempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 20 });
idempotencySchema.index({ key: 1 }, { unique: true });

export default mongoose.model("idempotency", idempotencySchema);