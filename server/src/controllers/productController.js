import mongoose from "mongoose";
import Seller from "../models/Shop.js";
import Product from "../models/Product.js";
import { AppError, catchAsync } from "../utils/error.js";

export const addProduct = catchAsync(async (req, res) => {
  const userId = req.auth.userId;
  const shop = await Seller.findOne({ ownerUserId: userId, status: "active" }).lean();
  if (!shop) throw new AppError("ยังไม่มีร้านที่ active", 403);

  const { name, price, description, stockQty, categories } = req.body;
  if (!name || !price) throw new AppError("กรุณากรอก name และ price", 400);

  const baseSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const slug = `${baseSlug}-${Date.now()}`;

  const data = {
    shopId: shop._id,
    name,
    slug,
    description: description || "",
    price: Number(price),
    stockQty: Number(stockQty) || 0,
    status: "active",
  };

  if (categories) {
    data.categories = Array.isArray(categories) ? categories : [categories];
  }
  if (req.file) {
    data.imagePublicIds = [req.file.filename];
  }

  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
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

const SHOP_SELECT = "name slug logoUrl ratingAvg";

export const getProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, category, minPrice, maxPrice, sort, q } = req.query;

  const filter = { status: "active" };
  if (category) filter.categories = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (q) filter.$text = { $search: q };

  const sortMap = { price_asc: { price: 1 }, price_desc: { price: -1 }, newest: { createdAt: -1 } };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const lim = Math.min(Number(limit), 100);
  const skip = (Number(page) - 1) * lim;

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(lim)
      .populate("shopId", SHOP_SELECT).lean(),
    Product.countDocuments(filter),
  ]);

  res.json({ success: true, items, total, page: Number(page), pages: Math.ceil(total / lim) });
});

export const getProductBySlug = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const isId = mongoose.Types.ObjectId.isValid(slug);
  const filter = isId ? { _id: slug, status: "active" } : { slug, status: "active" };

  const product = await Product.findOne(filter).populate("shopId", SHOP_SELECT).lean();
  if (!product) throw new AppError("ไม่พบสินค้า", 404);

  res.json({ success: true, product });
});
