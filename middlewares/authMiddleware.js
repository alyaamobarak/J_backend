const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError(401, 'Please login to access this resource'));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError(401, 'This user no longer exists'));
  }

  req.user = user;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You are not allowed to perform this action')
      );
    }
    next();
  };
};
