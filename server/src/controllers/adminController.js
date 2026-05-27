import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { AppError, catchAsync } from "../utils/error.js";

// ── Shops ──────────────────────────────────────────────

export const listShops = catchAsync(async (req, res) => {
  const { status, kycStatus, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (kycStatus) filter.kycStatus = kycStatus;

  const skip = (Number(page) - 1) * Number(limit);
  const [shops, total] = await Promise.all([
    Shop.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Shop.countDocuments(filter),
  ]);
  res.json({ success: true, shops, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const updateShopStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, reason = "" } = req.body;
  const allowed = ["active", "suspended", "closed"];
  if (!allowed.includes(status)) throw new AppError("สถานะไม่ถูกต้อง", 400);

  const shop = await Shop.findByIdAndUpdate(
    id,
    {
      status,
      $push: { audit: { action: `status:${status}`, byUserId: req.auth.userId, detail: reason } },
    },
    { new: true }
  );
  if (!shop) throw new AppError("ไม่พบร้าน", 404);

  if (status === "suspended") {
    await User.findByIdAndUpdate(shop.ownerUserId, { role: "user" });
  } else if (status === "active") {
    await User.findByIdAndUpdate(shop.ownerUserId, { role: "seller" });
  }

  res.json({ success: true, shop });
});

// ── Products ───────────────────────────────────────────

export const listProducts = catchAsync(async (req, res) => {
  const { status = "pending", page = 1, limit = 20 } = req.query;
  const filter = status === "all" ? {} : { status };
  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("shopId", "name slug").lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const updateProductStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["active", "draft", "suspended"];
  if (!allowed.includes(status)) throw new AppError("สถานะไม่ถูกต้อง", 400);

  const product = await Product.findByIdAndUpdate(id, { status }, { new: true });
  if (!product) throw new AppError("ไม่พบสินค้า", 404);
  res.json({ success: true, product });
});

// ── Users ──────────────────────────────────────────────

export const listUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select("-password -cartdata -addresses").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// ── Dashboard stats ────────────────────────────────────

export const getDashboardStats = catchAsync(async (_req, res) => {
  const [userCount, shopPending, productPending, orderCount] = await Promise.all([
    User.countDocuments(),
    Shop.countDocuments({ status: "pending" }),
    Product.countDocuments({ status: "pending" }),
    Order.countDocuments(),
  ]);
  res.json({ success: true, stats: { userCount, shopPending, productPending, orderCount } });
});
