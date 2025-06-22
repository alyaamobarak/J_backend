const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Order = require("../models/ordersModel");
const Seller = require("../models/sellerModel");
const Product = require("../models/productModel");

exports.createPayment = catchAsync(async (req, res, next) => {
  const { orderId, paymentMethod, totalPrice } = req.body;

  if (!orderId) return next(new AppError(400, "Order ID is required"));

  const order = await Order.findById(orderId).populate("orderItems.product");
  if (!order) return next(new AppError(404, "Order not found"));

  if (order.paymentStatus === "Paid") {
    return next(new AppError(400, "Order is already paid"));
  }

  const parsedTotal = Number(totalPrice);
  if (isNaN(parsedTotal)) {
    return next(new AppError(400, "Invalid total price format"));
  }
  if (!totalPrice)
    return next(new AppError(400, "Total amount must be specified"));

  if (parsedTotal !== order.totalPrice) {
    return next(
      new AppError(400, "Total amount mismatch with the order amount")
    );
  }

  if (paymentMethod === "CreditCard" || paymentMethod === "Installment") {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100,
      currency: "egp",
      metadata: {
        userId: req.user._id.toString(),
        orderId: order._id.toString(),
        paymentMethod,
      },
    });
    console.log("Stripe key is: ", process.env.STRIPE_SECRET_KEY);

    order.paymentStatus = "Pending";
    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Payment initiated successfully.",
      paymentMethod,
      clientSecret: paymentIntent.client_secret,
      order,
    });
  }

  if (paymentMethod === "COD") {
    order.paymentStatus = "Pending";
    order.orderStatus = "Processing";
    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Payment on delivery. Order is processing.",
      paymentMethod,
      clientSecret: null,
      order,
    });
  }

  return next(new AppError(400, "Invalid payment method"));
});

exports.confirmPayment = catchAsync(async (req, res, next) => {
  const { orderId } = req.body;

  if (!orderId) return next(new AppError(400, "Order ID is required"));

  const order = await Order.findById(orderId).populate("orderItems.product");
  if (!order) return next(new AppError(404, "Order not found"));

  if (order.paymentStatus === "Paid") {
    return next(new AppError(400, "Order is already paid"));
  }

  order.paymentStatus = "Paid";
  order.orderStatus = "Processing";
  await order.save();

  for (const item of order.orderItems) {
    const product = item.product;
    const seller = await Seller.findById(product.seller);

    if (seller) {
      const productAmount = item.price * item.quantity;
      seller.accountBalance = (seller.accountBalance || 0) + productAmount;
      await seller.save();
    }
  }

  return res.status(200).json({
    status: "success",
    message: "Payment confirmed and seller balances updated successfully.",
    order,
  });
});

exports.completeOrder = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;

  if (!orderId) return next(new AppError(400, "Order ID is required"));

  const order = await Order.findById(orderId).populate("orderItems.product");
  if (!order) return next(new AppError(404, "Order not found"));

  if (order.paymentStatus !== "Paid") {
    return next(new AppError(400, "Order must be paid before completion"));
  }

  if (order.orderStatus === "Delivered") {
    return next(new AppError(400, "Order is already completed"));
  }

  // تحقق من المخزون
  for (const item of order.orderItems) {
    if (item.product.stock < item.quantity) {
      return next(
        new AppError(
          400,
          `Insufficient stock for product: ${item.product.name}`
        )
      );
    }
  }

  // خصم الكمية من المنتجات
  for (const item of order.orderItems) {
    item.product.stock -= item.quantity;
    await item.product.save();
  }

  // تحديث حالة الطلب
  order.orderStatus = "Delivered";
  order.deliveredAt = new Date();
  await order.save();

  return res.status(200).json({
    status: "success",
    message: "Order completed successfully",
    order,
  });
});
