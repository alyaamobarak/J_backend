const express = require('express');
const router = express.Router();
const { protect } = require('../controllers/auth');
const {
  createPayment,
  confirmPayment,
  completeOrder,
} = require('../controllers/paymentControllers');

router.post('/create', protect, createPayment);
router.post('/confirm', protect, confirmPayment);
router.patch('/complete/:orderId', protect, completeOrder);

module.exports = router; 