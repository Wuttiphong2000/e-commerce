import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    orderId:   { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rating:    { type: Number, required: true, min: 1, max: 5 },
    comment:   { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
