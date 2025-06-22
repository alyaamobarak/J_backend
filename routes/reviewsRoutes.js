const express = require('express');
const {
  createReview,
  getAllReviews,
  getReviewsForProduct,
  updateReview,
  deleteReview,
} = require('../controllers/reviewControllers');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').get(getAllReviews).post(protect, createReview);
router.route('/:productId').get(getReviewsForProduct);
router
  .route('/:reviewId')
  .patch(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
