const Review = require('../models/reviewModel');
const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const updateProductRatings = async productId => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratings: stats.length > 0 ? stats[0].avgRating : 0,
  });
};

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new AppError(401, 'Unauthorized! Please log in.'));
  }

  const { review, rating, product } = req.body;
  const user = req.user.id;

  if (!review || !rating || !product) {
    return next(new AppError(400, 'Review, rating, and product are required.'));
  }

  if (rating < 1 || rating > 5) {
    return next(new AppError(400, 'Rating must be between 1 and 5'));
  }

  const productExists = await Product.findById(product);
  if (!productExists) {
    return next(new AppError(404, 'Product not found.'));
  }

  const existingReview = await Review.findOne({ product, user });
  if (existingReview) {
    return next(new AppError(400, 'You have already reviewed this product.'));
  }

  const newReview = await Review.create({ review, rating, product, user });

  await updateProductRatings(product);

  res.status(201).json({
    status: 'success',
    data: newReview,
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find()
    .populate('user', 'name email')
    .populate('product', 'name');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews,
  });
});

exports.getReviewsForProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.productId;
  const reviews = await Review.find({ product: productId }).populate(
    'user',
    'name email'
  );

  if (reviews.length === 0) {
    return next(new AppError(404, 'No reviews found for this product.'));
  }

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: reviews,
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new AppError(401, 'Unauthorized! Please log in.'));
  }

  const reviewId = req.params.reviewId;
  const userId = req.user.id;

  const review = await Review.findOne({ _id: reviewId, user: userId });

  if (!review) {
    return next(
      new AppError(404, 'Review not found or you are not authorized.')
    );
  }

  const updatedReview = await Review.findOneAndUpdate(
    { _id: reviewId, user: userId },
    {
      review: req.body.review || review.review,
      rating: req.body.rating || review.rating,
    },
    { new: true, runValidators: true }
  );

  if (!updatedReview) {
    return next(
      new AppError(404, 'Review not found or you are not authorized.')
    );
  }

  await updateProductRatings(updatedReview.product);

  res.status(200).json({
    status: 'success',
    data: updatedReview,
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return next(new AppError(401, 'Unauthorized! Please log in.'));
  }

  const reviewId = req.params.reviewId;
  const userId = req.user.id;

  const review = await Review.findOneAndDelete({ _id: reviewId, user: userId });

  if (!review) {
    return next(
      new AppError(404, 'Review not found or you are not authorized.')
    );
  }

  await updateProductRatings(review.product);

  res
    .status(200)
    .json({ status: true, message: 'Your Review deleted succssfully' });
});
