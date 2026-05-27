import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { AppError, catchAsync } from "../utils/error.js";

export const getReviews = catchAsync(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    Review.find({ productId: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "firstname lastname")
      .lean(),
    Review.countDocuments({ productId: id }),
  ]);

  res.json({ success: true, reviews, total, page, pages: Math.ceil(total / limit) });
});

export const createReview = catchAsync(async (req, res) => {
  const { id: productId } = req.params;
  const userId = req.auth.userId;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) throw new AppError("rating ต้องเป็น 1-5", 400);

  const product = await Product.findById(productId);
  if (!product) throw new AppError("ไม่พบสินค้า", 404);

  const review = await Review.create({ userId, productId, rating: Number(rating), comment: comment?.trim() || "" });

  const agg = await Review.aggregate([
    { $match: { productId: product._id } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  if (agg.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingAvg: Math.round(agg[0].avg * 10) / 10,
      ratingCount: agg[0].count,
    });
  }

  const populated = await review.populate("userId", "firstname lastname");
  res.status(201).json({ success: true, review: populated });
});
