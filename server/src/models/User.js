import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: { type: mongoose.Schema.Types.ObjectId }, // ถ้ามี variant
    quantity: { type: Number, default: 1 },
    productName: String, // snapshot
    price: Number, // snapshot
    imagePublicId: String, // snapshot
  },
  { _id: true }
);

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    firstname: { type: String, required: true },
    middlename: { type: String },
    lastname: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "seller", "admin"], default: "user" },
    profileImageUrl: String,
    profileImagePublicId: String,
    phone: String,
    addresses: [addressSchema],
    cartdata: [cartItemSchema],
    lastLogin: Date,
    passwordChangedAt: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);

export default User;
