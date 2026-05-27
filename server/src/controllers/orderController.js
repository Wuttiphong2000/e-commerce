import { validationResult } from "express-validator";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Seller from "../models/Shop.js";
import { AppError, catchAsync } from "../utils/error.js";

function assertValid(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array()[0]?.msg || "Invalid input";
    throw new AppError(msg, 422);
  }
}

// POST /api/orders
export const createOrder = catchAsync(async (req, res) => {
  assertValid(req);

  const { shippingAddressIdx, paymentMethod } = req.body;
  const userId = req.auth.userId;

  const user = await User.findById(userId);
  if (!user) throw new AppError("ไม่พบผู้ใช้", 404);
  if (!user.cartdata?.length) throw new AppError("ตะกร้าสินค้าว่าง", 400);

  const idx = Number(shippingAddressIdx);
  if (!Number.isInteger(idx) || !user.addresses?.[idx]) {
    throw new AppError("ไม่พบที่อยู่จัดส่ง", 400);
  }

  // Validate stock for all cart items
  const productIds = user.cartdata.map((it) => it.itemId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = Object.fromEntries(
    products.map((p) => [String(p._id), p])
  );

  for (const item of user.cartdata) {
    const product = productMap[String(item.itemId)];
    if (!product || product.status !== "active") {
      throw new AppError(`สินค้า "${item.productName}" ไม่พร้อมขาย`, 400);
    }
    if (product.stockQty < item.quantity) {
      throw new AppError(
        `สินค้า "${item.productName}" มีสต็อกไม่พอ (เหลือ ${product.stockQty} ชิ้น)`,
        400
      );
    }
  }

  // Build order items snapshot
  const orderItems = user.cartdata.map((item) => ({
    shopId: item.shopId,
    productId: item.itemId,
    variantId: item.variantId,
    productName: item.productName,
    price: item.price,
    quantity: item.quantity,
    imagePublicId: item.imagePublicId,
  }));

  const addr = user.addresses[idx];
  const shippingAddress = {
    street: addr.street,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    country: addr.country,
  };

  const subtotal = orderItems.reduce(
    (sum, it) => sum + it.price * it.quantity,
    0
  );
  const shippingFee = 0;
  const total = subtotal + shippingFee;

  const order = await Order.create({
    userId,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    subtotal,
    shippingFee,
    discount: 0,
    total,
  });

  // Decrement stock and increment soldCount
  await Promise.all(
    user.cartdata.map((item) =>
      Product.findByIdAndUpdate(item.itemId, {
        $inc: { stockQty: -item.quantity, soldCount: item.quantity },
      })
    )
  );

  // Clear cart
  user.cartdata = [];
  await user.save();

  res.status(201).json({ success: true, order });
});

// GET /api/orders
export const getMyOrders = catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ userId: req.auth.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments({ userId: req.auth.userId }),
  ]);

  res.json({
    success: true,
    orders,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

// GET /api/orders/:id
export const getOrderById = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw new AppError("ไม่พบคำสั่งซื้อ", 404);
  if (String(order.userId) !== String(req.auth.userId)) {
    throw new AppError("ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้", 403);
  }
  res.json({ success: true, order });
});

// GET /api/orders/seller-orders  (seller only)
export const getSellerOrders = catchAsync(async (req, res) => {
  const shop = await Seller.findOne({ ownerUserId: req.auth.userId }).lean();
  if (!shop) throw new AppError("ไม่พบร้าน", 404);

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { "items.shopId": shop._id };
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, orders, total, page, pages: Math.ceil(total / limit) });
});

// PATCH /api/orders/:id/ship  (seller only)
export const shipOrder = catchAsync(async (req, res) => {
  const shop = await Seller.findOne({ ownerUserId: req.auth.userId }).lean();
  if (!shop) throw new AppError("ไม่พบร้าน", 404);

  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("ไม่พบคำสั่งซื้อ", 404);

  const hasItem = order.items.some((it) => String(it.shopId) === String(shop._id));
  if (!hasItem) throw new AppError("ไม่มีสิทธิ์จัดการคำสั่งซื้อนี้", 403);

  if (!["paid", "processing"].includes(order.status)) {
    throw new AppError("ไม่สามารถอัปเดตสถานะได้ในขณะนี้", 400);
  }

  order.status = "shipped";
  if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
  await order.save();

  res.json({ success: true, order });
});

// PATCH /api/orders/:id/cancel
export const cancelOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("ไม่พบคำสั่งซื้อ", 404);
  if (String(order.userId) !== String(req.auth.userId)) {
    throw new AppError("ไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้", 403);
  }

  const cancellable = ["pending_payment", "paid"];
  if (!cancellable.includes(order.status)) {
    throw new AppError("ไม่สามารถยกเลิกคำสั่งซื้อในสถานะนี้ได้", 400);
  }

  order.status = "cancelled";
  order.cancelReason = req.body.cancelReason || "ยกเลิกโดยผู้ใช้";
  await order.save();

  res.json({ success: true, order });
});
