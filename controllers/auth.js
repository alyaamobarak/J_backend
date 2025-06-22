const User = require('../models/userModel');
const BlackListToken = require('../models/blackListToken');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const generateRandomNumber = require('../utils/generateRandomNumber');
const sendEmail = require('../utils/sendingEmail');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Seller = require('../models/sellerModel');

exports.interaction = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError(400, 'pls enter your email address'));
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({
      status: 'success',
      message:
        'Welcome into jumia backend clone pls use this route /api/v1/users/signup to signUp',
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Welcome back pls use this route /api/v1/users/signIn to login',
  });
});

exports.signUp = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    mobilePhone,
    gender,
    dateOfBirth,
    address,
  } = req.body;

  if (
    !name ||
    !email ||
    !password ||
    !passwordConfirm ||
    !mobilePhone ||
    !gender ||
    !dateOfBirth
  ) {
    return next(
      new AppError(
        400,
        'Enter all required fields name, email, password, passwordConfirm, mobilePhone,gender dateOfBirth'
      )
    );
  }

  if (password !== passwordConfirm) {
    return next(
      new AppError(400, 'password and passwordConfirm are not the same')
    );
  }

  const user = await User.create({
    name,
    email,
    password,
    mobilePhone,
    gender,
    dateOfBirth,
    address,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRETKEY, {
    expiresIn: process.env.JWK_EXPIRES,
  });

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

exports.signIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError(400, 'enter your email and password'));

  const user = await User.findOne({ email }).select('+password');
  if (!user)
    return next(new AppError(400, 'there is no user with this email address'));

  if (!(await bcrypt.compare(password, user.password))) {
    return next(
      new AppError(401, 'Invalid credentials .. incorrect email or password')
    );
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRETKEY, {
    expiresIn: process.env.JWK_EXPIRES,
  });

  res.status(200).json({
    status: 'success',
    token,
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError(400, 'pls enter your email address'));

  const user = await User.findOne({ email });

  if (!user)
    return next(new AppError(404, 'there is no user with this email address'));

  if (user.isVerified)
    return next(new AppError(400, 'this account is already verified'));

  user.emailVerificationCode = generateRandomNumber();
  user.emailVerificationCodeExpiresIn = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const subject = 'jumia backend clone email verify';
  const message = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <title>Reset Password Code</title>
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
          <div class="code">${user.emailVerificationCode}</div>
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
      message: 'The confirmation code has been sent to your email successfully',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'something wrong happen while sending email try again later',
      err,
    });
  }
});

exports.resendEmailVerificationCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError(400, 'enter your email address'));

  const user = await User.findOne({ email });

  if (user.isVerified)
    return next(new AppError(400, 'this account is already verified'));

  user.emailVerificationCode = generateRandomNumber();
  user.emailVerificationCodeExpiresIn = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  const subject = 'jumia backend clone email verify';
  const message = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <title>Reset Password Code</title>
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
          <div class="code">${user.emailVerificationCode}</div>
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
      message: 'The confirmation code has been sent to your email successfully',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'something wrong happen while sending email try again later',
      err,
    });
  }
});

exports.confirmEmailVerificationCode = catchAsync(async (req, res, next) => {
  const { email, emailVerificationCode } = req.body;

  if (!email || !emailVerificationCode)
    return next(
      new AppError(400, 'pls enter your email and verification code')
    );

  if (typeof emailVerificationCode !== 'number')
    return next(new AppError(400, 'verification code must be of type number'));

  const user = await User.findOne({ email });

  if (!user) return next(404, 'there is no user with this email address');

  if (
    user.emailVerificationCode !== emailVerificationCode ||
    user.emailVerificationCodeExpiresIn < new Date()
  ) {
    return next(
      new AppError(400, 'this code is not correct or not valid anymore')
    );
  }

  user.emailVerificationCode = undefined;
  user.emailVerificationCodeExpiresIn = undefined;
  user.isVerified = true;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'your email is verified successfully',
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ').at(1);
  }

  if (!token) {
    return next(new AppError(401, 'pls login to get access to this resource'));
  }

  const blackListToken = await BlackListToken.findOne({ token });
  if (blackListToken)
    return next(
      new AppError(401, 'You logged out .. please login again to get access')
    );

  const payload = jwt.verify(token, process.env.JWT_SECRETKEY);

  const [user, seller] = await Promise.all([
    User.findById(payload.id),
    Seller.findById(payload.id),
  ]);

  const account = user || seller;
  if (!account) {
    return next(new AppError(401, 'this user is no longer exist'));
  }

  if (account.passwordChangedAt) {
    const time = Math.floor(account.passwordChangedAt.getTime() / 1000);
    passwordChangedAfterTokenIssued = time > payload.iat;
  } else {
    passwordChangedAfterTokenIssued = false;
  }

  if (passwordChangedAfterTokenIssued) {
    return next(
      new AppError(
        401,
        'User has recently changed their password. Please log in again.'
      )
    );
  }

  req.user = account;
  req.token = token;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'you are not allowed to perform this action')
      );
    }
    next();
  };
};

exports.logout = catchAsync(async (req, res, next) => {
  await BlackListToken.create({
    token: req.token,
  });
  res.status(204).json({
    status: 'success',
    message: 'you logged out successfully',
  });
});

exports.deleteAccount = catchAsync(async (req, res, next) => {
  const deletedUser = await User.findByIdAndDelete(req.user._id);
  if (!deletedUser) return next(new AppError(404, 'this user does not exist'));
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError(400, 'enter you email address'));

  const [user, seller] = await Promise.all([
    User.findOne({ email }),
    Seller.findOne({ email }),
  ]);

  const account = user || seller;
  if (!account) {
    return next(new AppError(404, 'No account found with this email address.'));
  }

  const resetCode = generateRandomNumber();

  account.passwordResetCode = resetCode;
  account.passwordResetCodeExpireDate = new Date(Date.now() + 5 * 60 * 1000);
  account.allowedToResetPassword = false;
  await account.save({ validateBeforeSave: false });

  const subject = 'password reset code for jumia backend clone';
  const message = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <title>Reset Password Code</title>
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
          <h2>password reset code</h2>
          <p>Use this code to reset your password .. this code valid only for 5 mins</p>
          <div class="code">${resetCode}</div>
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
      message:
        'The password reset code has been sent to your email successfully',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'something wrong happen while sending email try again later',
      err,
    });
  }
});

exports.resendPasswordResetCode = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) return next(new AppError(400, 'enter your email address'));

  const [user, seller] = await Promise.all([
    User.findOne({ email }),
    Seller.findOne({ email }),
  ]);

  const account = user || seller;
  if (!account) {
    return next(new AppError(404, 'No account found with this email address.'));
  }

  const passwordResetCode = generateRandomNumber();
  account.passwordResetCode = passwordResetCode;
  account.passwordResetCodeExpireDate = new Date(Date.now() + 5 * 60 * 1000);
  account.allowedToResetPassword = false;
  await account.save({ validateBeforeSave: false });

  const subject = 'password reset code for jumia backend clone';
  const message = `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <title>Reset Password Code</title>
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
          <h2>password reset code</h2>
          <p>Use this code to reset your password .. this code valid only for 5 mins</p>
          <div class="code">${passwordResetCode}</div>
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
      message:
        'The password reset code has been sent to your email successfully',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'something wrong happen while sending email try again later',
      err,
    });
  }
});

exports.confirmPasswordResetCode = catchAsync(async (req, res, next) => {
  const { email, passwordResetCode } = req.body;
  if (!email || !passwordResetCode)
    return next(new AppError(400, 'enter your email and passwordResetCode'));

  if (typeof passwordResetCode !== 'number')
    return next(new AppError(400, 'passwordResetCode must be of type number'));

  const [user, seller] = await Promise.all([
    User.findOne({ email }),
    Seller.findOne({ email }),
  ]);

  const account = user || seller;
  if (!account) {
    return next(new AppError(404, 'No account found with this email address.'));
  }

  if (
    account.passwordResetCode !== passwordResetCode ||
    account.passwordResetCodeExpireDate < Date.now()
  )
    return next(
      new AppError(
        400,
        'Incorrect password reset code or this code not valid anymore'
      )
    );

  account.passwordResetCode = undefined;
  account.passwordResetCodeExpireDate = undefined;
  account.allowedToResetPassword = true;
  await account.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'password reset code confirmed .. You can reset your password now',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email, password, passwordConfirm } = req.body;
  if (!email || !password || !passwordConfirm)
    return next(
      new AppError(
        400,
        'enter your email, password and passwordConfirm to reset your password'
      )
    );

  const [user, seller] = await Promise.all([
    User.findOne({ email }),
    Seller.findOne({ email }),
  ]);

  const account = user || seller;
  if (!account) {
    return next(new AppError(404, 'No account found with this email address.'));
  }

  if (!account.allowedToResetPassword)
    return next(
      new AppError(
        400,
        'you are not allowed to reset your password until entering a valid reset password code'
      )
    );

  if (password !== passwordConfirm)
    return next(
      new AppError(400, 'password and passwordConfirm are not the same')
    );

  account.password = password;
  account.passwordChangedAt = new Date();
  account.allowedToResetPassword = undefined;

  await account.save({ validateBeforeSave: false });

  const token = jwt.sign({ id: account._id }, process.env.JWT_SECRETKEY, {
    expiresIn: process.env.JWK_EXPIRES,
  });

  res.status(200).json({
    status: 'success',
    message: 'you reset your password successfully',
    token,
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, passwordConfirm } = req.body;
  if (!currentPassword || !newPassword || !passwordConfirm)
    return next(
      new AppError(
        400,
        'enter you currentPassword, newPassword and passwordConfirm to change your password'
      )
    );

  if (newPassword !== passwordConfirm)
    return next(
      new AppError(400, 'newPassword and passwordConfirm are not the same')
    );

  const user = await User.findById(req.user.id).select('+password');

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return next(new AppError(400, 'Incorrect currentPassword'));
  }

  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRETKEY, {
    expiresIn: process.env.JWK_EXPIRES,
  });

  res.status(200).json({
    status: 'success',
    message: 'your password updated successfully',
    token,
  });
});

exports.getUserData = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { name, gender, dateOfBirth } = req.body;
  if (!name || !gender || !dateOfBirth) {
    return next(
      new AppError(
        400,
        'please enter name, gender and dateOfBirth to update your account data'
      )
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { name, gender, dateOfBirth },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

exports.updatePhoneNumber = catchAsync(async (req, res, next) => {
  const { mobilePhone } = req.body;

  if (!mobilePhone) {
    return next(new AppError(400, 'enter your mobilePhone'));
  }

  if (mobilePhone === req.user.mobilePhone) {
    return next(
      new AppError(400, 'you already use this phone number try another one')
    );
  }

  const existedUser = await User.findOne({ mobilePhone });
  if (existedUser) {
    return next(
      new AppError(400, 'this phone is already used try another one')
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { mobilePhone },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

exports.updateUserAddress = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { street, city, governorate } = req.body;
  if (!street || !city || !governorate) {
    return next(
      new AppError(
        400,
        'enter street, city and governorate to update your address'
      )
    );
  }

  const address = {
    street,
    city,
    governorate,
  };

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { address },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});
