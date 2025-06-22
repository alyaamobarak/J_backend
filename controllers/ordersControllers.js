const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const Order = require("./../models/ordersModel");

//create method
exports.createOrder = catchAsync(async (req, res, next) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    shippingMethod,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (!orderItems) {
    return next(new AppError(400, "No order items provided"));
  }

  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.phone ||
    !shippingAddress.address ||
    !shippingAddress.city ||
    !shippingAddress.region
  ) {
    return next(new AppError(400, "Shipping address is incomplete"));
  }

  if (
    !paymentMethod ||
    !["COD", "CreditCard", "Installment"].includes(paymentMethod)
  ) {
    return next(new AppError(400, "Invalid or missing payment method"));
  }

  if (
    !shippingMethod ||
    !["HomeDelivery", "PickupStation"].includes(shippingMethod)
  ) {
    return next(new AppError(400, "Invalid or missing shipping method"));
  }

  if (!shippingPrice || typeof shippingPrice !== "number") {
    return next(
      new AppError(400, "Shipping price is required and must be a number")
    );
  }

  if (!totalPrice || typeof totalPrice !== "number") {
    return next(
      new AppError(400, "Total price is required and must be a number")
    );
  }

  // adding order number:
  const orderNumber = Math.floor(10000 + Math.random() * 90000);

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    shippingMethod,
    shippingPrice,
    totalPrice,
    orderNumber,
  });

  res.status(201).json({
    status: "success",
    data: {
      order,
    },
  });
});

//getAllOrders method
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find()
    .populate({ path: "user", select: "name email" })
    .populate({ path: "orderItems.product", select: "name price" });

  res.status(200).json({
    status: "success",
    data: {
      orders,
    },
  });
});

// get my orders
exports.getMyOrders = catchAsync(async (req, res, next) => {
    console.log('REQ.USER FROM getMyOrders:', req.user);
  const orders = await Order.find({ user: req.user._id }).populate({
    path: "orderItems.product",
    select: "name price image",
  });

  res.status(200).json({
    status: "success",
    data: {
      orders,
    },
  });
});

// display product by id
exports.getOrderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id)
    .populate({ path: "user", select: "name email" })
    .populate({ path: "orderItems.product", select: "name price" });

  if (!order) return next(new AppError(404, "No order found for this ID"));

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

// update order
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  //   if(orderStatus ==='Delivered'){
  //  const  deliveredAt = newDate();
  //   }

  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    {
      orderStatus,
      deliveredAt: orderStatus === "Delivered" ? new Date() : null,
      cancelledAt: orderStatus === "Cancelled" ? new Date() : null,
    },

    { new: true }
  );

  if (!updatedOrder)
    return next(new AppError(404, "No order found for this ID"));

  res.status(200).json({
    status: "success",
    data: {
      updatedOrder,
    },
  });
});

//cancel order
exports.deleteOrderById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const deletedOrder = await Order.findByIdAndDelete(id);

  if (!deletedOrder)
    return next(new AppError(404, "No order found for this ID"));

  res.status(204).json({
    status: "success",
    data: null,
  });
});
