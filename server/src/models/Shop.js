import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const bankAccountSchema = new mongoose.Schema(
  {
    bankCode: String,
    accountName: String,
    accountNumber: String,
  },
  { _id: false }
);

const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "suspended", "closed"],
      default: "pending",
    },
    kycStatus: {
      type: String,
      enum: ["none", "submitted", "verified", "rejected"],
      default: "none",
    },
    kycReason: String,
    kycUpdatedAt: Date,

    logoUrl: String,
    bannerUrl: String,
    description: String,
    tags: [String],
    categoriesMain: [String],

    shippingPolicy: String,
    returnPolicy: String,
    warrantyPolicy: String,
    daysToShip: { type: Number, default: 2 },
    chatAutoReply: String,

    shipFromAddress: addressSchema,
    pickupLocations: [addressSchema],
    supportedCarriers: [String],
    codEnabled: { type: Boolean, default: false },
    defaultShippingProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingProfile",
    },

    payoutMethod: { type: String, enum: ["bank"], default: "bank" },
    bankAccount: bankAccountSchema,
    settlementCycle: {
      type: String,
      enum: ["weekly", "biweekly", "monthly"],
      default: "monthly",
    },
    taxId: String,
    vatRegistered: { type: Boolean, default: false },

    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    responseRate: { type: Number, default: 100 },
    avgResponseTime: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    totalSalesAmount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    cancellationRate: { type: Number, default: 0 },
    lateShipmentRate: { type: Number, default: 0 },

    vacationMode: { type: Boolean, default: false },
    vacationMessage: String,
    strikeCount: { type: Number, default: 0 },
    suspendReason: String,
    suspendUntil: Date,

    audit: [
      {
        action: String,
        byUserId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        at: { type: Date, default: Date.now },
        detail: String,
      },
    ],
  },
  { timestamps: true }
);

sellerSchema.index({ slug: 1 }, { unique: true });
sellerSchema.index({ ownerUserId: 1 });
sellerSchema.index({ status: 1 });
sellerSchema.index({ kycStatus: 1 });

const Seller = mongoose.model("Seller", sellerSchema);

export default Seller;
