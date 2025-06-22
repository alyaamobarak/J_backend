const express = require('express');
const { protect, restrictTo } = require('./../controllers/auth');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrderById,
  getMyOrders,
} = require('../controllers/ordersControllers');

const router = express.Router();
router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/', protect, restrictTo('admin'), getAllOrders);
router.get('/:id', protect, getOrderById);
router.patch('/:id', protect, restrictTo('admin', 'seller'), updateOrderStatus);
router.delete('/:id', protect, restrictTo('admin'), deleteOrderById);

module.exports = router;
