const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Cart = require('./../models/cartModel');
const Product = require('./../models/productModel');

exports.getUserCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart) return next(new AppError(404, 'cart is empty'));

  const size = cart.items.reduce((total, item) => total + item.quantity, 0);

  res.status(200).json({
    status: 'success',
    size,
    data: {
      cart,
    },
  });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  if (!productId || !quantity)
    return next(new AppError(400, 'enter productId and quantity'));

  const userId = req.user.id;
  const product = await Product.findById(productId);

  if (!product)
    return next(new AppError(404, 'There is no product with this ID'));

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }

  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.updateCartTotal();

  cart = await cart.populate('items.product');

  const size = cart.items.reduce((total, item) => total + item.quantity, 0);

  res.status(200).json({
    status: 'success',
    size,
    data: { cart },
  });
});

exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  if (!productId || quantity === undefined)
    return next(
      new AppError(
        400,
        'enter productId and the updated quantity to update cart'
      )
    );

  const userId = req.user.id;
  let cart = await Cart.findOne({ user: userId });
  if (!cart) return next(new AppError(404, 'There is no cart for this user'));

  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );
  if (itemIndex === -1)
    return next(new AppError(404, 'This product does not exist in the cart'));

  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  if (cart.items.length === 0) {
    await Cart.findByIdAndDelete(cart._id);
    return res.status(204).json({
      status: 'success',
      message: 'Cart is now empty and deleted',
      data: null,
    });
  }

  await cart.updateCartTotal();

  cart = await cart.populate('items.product');

  const size = cart.items.reduce((total, item) => total + item.quantity, 0);

  res.status(200).json({
    status: 'success',
    size,
    data: { cart },
  });
});

exports.removeCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user.id;

  let cart = await Cart.findOne({ user: userId });
  if (!cart) return next(new AppError(404, 'There is no cart for this user'));

  cart.items = cart.items.filter(item => item.product.toString() !== productId);

  await cart.updateCartTotal();
  cart = await cart.populate('items.product');

  const size = cart.items.reduce((total, item) => total + item.quantity, 0);

  res.status(200).json({
    status: 'success',
    size,
    message: 'Item removed successfully',
    data: { cart },
  });
});

exports.clearCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  await Cart.findOneAndDelete({ user: userId });

  res.status(204).json({
    status: 'success',
    message: 'Cart cleared successfully',
    data: null,
  });
});
