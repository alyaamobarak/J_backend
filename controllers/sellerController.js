const Seller = require('./../models/sellerModel');
const Order = require('./../models/ordersModel');
const TempSeller = require('./../models/tempSellersModel');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appError');
const sendEmail = require('./../utils/sendingEmail');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const generateRandomNumber = require('./../utils/generateRandomNumber');

exports.initiateSellerRegistration = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new appError(400, 'provide your email address'));

  const existedSeller = await Seller.findOne({ email });

  if (existedSeller)
    return next(
      new appError(400, 'this email is already used for another seller account')
    );

  const verificationCode = generateRandomNumber();
  await TempSeller.create({
    email,
    verificationCode,
    verificationCodeExpiresIn: Date.now() + 30 * 60 * 1000,
  });

  const subject = 'jumia backend clone email verify';
  const message = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>email verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                background: #ffffff;
                margin: 20px auto;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .code {
                font-size: 24px;
                font-weight: bold;
                color: red;
                background: #f8f8f8;
                padding: 10px 20px;
                display: inline-block;
                border-radius: 5px;
                margin: 15px 0;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Email Verification</h2>
            <p>Use this code to verify your email. This code is valid for 30 minutes</p>
            <div class="code">${verificationCode}</div>
            <p>If you did not request this, please ignore this email. Your account is safe.</p>
            <div class="footer">
                <p>Best regards,<br>Jumia backend clone</p>
            </div>
        </div>
    </body>
    </html>
    `;
  try {
    await sendEmail({ html: message, subject, to: email });

    res.status(200).json({
      status: 'success',
      message: 'The verification code has been sent to your email successfully',
    });
  } catch (err) {
    console.log(err);

    next(new appError(500, err.msg));
    // res.status(500).json({
    //   status: 'error',
    //   message: 'something wrong happen while sending email try again later',
    //   err,
    // });
  }
});

exports.resendEmailVerificationCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new appError(400, 'provide your email address'));

  const tempSeller = await TempSeller.findOne({ email });
  if (!tempSeller)
    return next(new appError(404, 'you have not ask verification code before'));

  const newVerificationCode = generateRandomNumber();
  tempSeller.verificationCode = newVerificationCode;
  tempSeller.verificationCodeExpiresIn = Date.now() + 30 * 60 * 1000;

  await tempSeller.save();

  const subject = 'jumia backend clone email verify';
  const message = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>email verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                background: #ffffff;
                margin: 20px auto;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .code {
                font-size: 24px;
                font-weight: bold;
                color: red;
                background: #f8f8f8;
                padding: 10px 20px;
                display: inline-block;
                border-radius: 5px;
                margin: 15px 0;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Email Verification</h2>
            <p>Use this code to verify your email. This code is valid for 30 minutes</p>
            <div class="code">${newVerificationCode}</div>
            <p>If you did not request this, please ignore this email. Your account is safe.</p>
            <div class="footer">
                <p>Best regards,<br>Jumia backend clone</p>
            </div>
        </div>
    </body>
    </html>
    `;
  try {
    await sendEmail({ html: message, subject, to: email });

    res.status(200).json({
      status: 'success',
      message: 'The verification code has been sent to your email successfully',
    });
  } catch (err) {
    console.log(err);

    next(new appError(500, err.msg));
    // res.status(500).json({
    //   status: 'error',
    //   message: 'something wrong happen while sending email try again later',
    //   err,
    // });
  }
});

exports.confirmEmailVerificationCode = catchAsync(async (req, res, next) => {
  const { email, verificationCode } = req.body;
  if (!email || !verificationCode)
    return next(new appError(400, 'Provide email and verification code'));

  if (typeof verificationCode !== 'number')
    return next(new appError(400, 'verificationCode must be of type number'));

  const tempSeller = await TempSeller.findOne({ email });

  if (!tempSeller)
    return next(new appError(404, 'No verification code found for this email'));

  if (
    tempSeller.verificationCode !== verificationCode ||
    tempSeller.verificationCodeExpiresIn < Date.now()
  ) {
    return next(
      new appError(
        400,
        'Invalid verification code or this code not valid any more'
      )
    );
  }

  await TempSeller.findByIdAndDelete(tempSeller._id);

  res.status(200).json({
    status: 'success',
    message: 'your email verified successfully',
  });
});

exports.completeSignUp = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    passwordConfirm,
    accountType,
    storeName,
    shippingArea,
    listenAboutJumiaFrom,
    country,
  } = req.body;

  if (
    !name ||
    !email ||
    !phone ||
    !password ||
    !passwordConfirm ||
    !accountType ||
    !storeName ||
    !shippingArea ||
    !listenAboutJumiaFrom ||
    !country
  ) {
    return next(
      new appError(
        400,
        'pls provide name, email, phone, password, passwordConfirm, accountType,storeName, shippingArea, listenFromJumiaFrom, country'
      )
    );
  }

  if (password !== passwordConfirm)
    return next(
      new appError(400, 'password and passwordConfirm are not the same')
    );

  const seller = await Seller.create({
    name,
    email,
    phone,
    password,
    accountType,
    storeName,
    shippingArea,
    listenAboutJumiaFrom,
    country,
  });

  const token = jwt.sign(
    { id: seller._id, role: 'seller' },
    process.env.JWT_SECRETKEY,
    {
      expiresIn: process.env.JWK_EXPIRES,
    }
  );

  res.status(201).json({
    status: 'success',
    token,
    data: {
      seller,
    },
  });
});

exports.loginByEmail = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new appError(400, 'provide email and password'));

  const seller = await Seller.findOne({ email }).select('+password');
  if (!seller)
    return next(new appError(404, 'no seller found with this email'));

  if (!(await bcrypt.compare(password, seller.password)))
    return next(new appError(401, 'password is incorrect'));

  const token = jwt.sign(
    { id: seller._id, role: 'seller' },
    process.env.JWT_SECRETKEY,
    {
      expiresIn: process.env.JWK_EXPIRES,
    }
  );

  res.status(200).json({
    status: 'success',
    token,
  });
});

// get seller orders
exports.getSellerOrders = catchAsync(async (req, res, next) => {
  const sellerId = req.user._id;

  const orders = await Order.find({
    'orderItems.seller': sellerId,
  })
    .populate('orderItems.product', 'name price')
    .sort({ createdAt: -1 });

  const filteredOrders = orders.map(order => {
    const sellerItems = order.orderItems.filter(item =>
      item.seller.equals(sellerId)
    );

    const totalPrice = sellerItems.reduce((acc, item) => {
      return acc + item.price * item.quantity;
    }, 0);

    return {
      _id: order._id,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      orderNumber: order.orderNumber,
      totalPrice,
      items: sellerItems,
    };
  });

  res.status(200).json(filteredOrders);
});

exports.getSellerCompletedOrders = catchAsync(async (req, res, next) => {
  const sellerId = req.user._id;
  const orders = await Order.find({
    paymentStatus: 'Paid',
    'orderItems.seller': sellerId,
  })
    .populate('user', 'name email')
    .populate('orderItems.product', 'name');

  const sellerOrders = orders.map(order => {
    const sellerItems = order.orderItems.filter(
      item => item.seller.toString() === sellerId.toString()
    );

    return {
      accountBalance: req.user.accountBalance,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      totalPrice: sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
      deliveredAt: order.deliveredAt,
      user: order.user,
      items: sellerItems.map(item => ({
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  });

  res.status(200).json({
    status: 'success',
    data: sellerOrders,
  });
});
