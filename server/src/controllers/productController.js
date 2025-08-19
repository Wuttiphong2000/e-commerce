import Seller from "../models/Shop.js";
import Product from "../models/Product.js";
import { AppError, catchAsync } from "../utils/error.js";

export const addProduct = catchAsync(async (req, res) => {
  const userId = req.auth.userId;
  const shop = await Seller.findOne({ ownerUserId: userId, status: "active" }).lean();
  if (!shop) throw new AppError("ยังไม่มีร้านที่ active", 403);

  const { name, price, description } = req.body;
  if (!name || !price) throw new AppError("กรุณากรอก name และ price", 400);
  if (!req.file) throw new AppError("กรุณาแนบรูป (field: image)", 400);

  const imageUrl = req.file.path;
  const product = await Product.create({
    shopId: shop._id,
    name,
    description: description || "",
    price: Number(price),
    images: [imageUrl],
    status: "active",
  });

  res.status(201).location(`/api/product/${product._id}`).json({ success: true, product });
});

export const getMyProducts = catchAsync(async (req, res) => {
  const userId = req.auth.userId;
  const shop = await Seller.findOne({ ownerUserId: userId }).lean();
  if (!shop) throw new AppError("ยังไม่มีร้าน", 404);

  const { page = 1, limit = 20, status } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = { shopId: shop._id };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Product.countDocuments(query),
  ]);

  res.json({ success: true, items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

export const updateMyProduct = catchAsync(async (req, res) => {
  const userId = req.auth.userId;
  const shop = await Seller.findOne({ ownerUserId: userId }).lean();
  if (!shop) throw new AppError("ยังไม่มีร้าน", 403);

  const { id } = req.params;
  const product = await Product.findOneAndUpdate(
    { _id: id, shopId: shop._id },
    { $set: req.body },
    { new: true }
  );
  if (!product) throw new AppError("ไม่พบสินค้าของร้านคุณ", 404);

  res.json({ success: true, product });
});

export const deleteMyProduct = catchAsync(async (req, res) => {
  const userId = req.auth.userId;
  const shop = await Seller.findOne({ ownerUserId: userId }).lean();
  if (!shop) throw new AppError("ยังไม่มีร้าน", 403);

  const { id } = req.params;
  const deleted = await Product.findOneAndDelete({ _id: id, shopId: shop._id });
  if (!deleted) throw new AppError("ไม่พบสินค้าของร้านคุณ", 404);

  res.status(204).end();
});
