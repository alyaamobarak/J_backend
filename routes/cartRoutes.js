const express = require('express');
const carController = require('./../controllers/cartControllers');

const { protect, restrictTo } = require('./../controllers/auth');

const router = express.Router();

router.get('/', protect, restrictTo('customer'), carController.getUserCart);
router.post('/', protect, restrictTo('customer'), carController.addToCart);

router.patch(
  '/',
  protect,
  restrictTo('customer'),
  carController.updateCartItem
);

router.delete(
  '/:productId',
  protect,
  restrictTo('customer'),
  carController.removeCartItem
);

router.get(
  '/clearCart',
  protect,
  restrictTo('customer'),
  carController.clearCart
);

module.exports = router;
