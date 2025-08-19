import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    attrs: { type: Map, of: String }, // เช่น { color: "red", size: "M" }
    price: { type: Number, required: true },
    stockQty: { type: Number, default: 0 },
    skuCode: String,
    weight: { type: Number, default: 0 }, // กรัม
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    name: { type: String, required: true },
    slug: { type: String, trim: true, lowercase: true },
    description: { type: String },
    imagePublicIds: [{ type: String }],
    categories: [{ type: String }],
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "active", "suspended"],
      default: "draft",
    },
    variants: [variantSchema],
    price: { type: Number, required: true },
    stockQty: { type: Number, default: 0 },
    skuCode: String,
    weight: { type: Number, default: 0 },
    dimensions: { length: Number, width: Number, height: Number },
    soldCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
productSchema.index({ shopId: 1, slug: 1 }, { unique: true });
productSchema.index({ shopId: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: 1 });
productSchema.index({ status: 1 });

productSchema.index({ name: "text", description: "text" });

const Product = mongoose.model("Product", productSchema);

export default Product;
