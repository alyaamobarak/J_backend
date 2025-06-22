const express = require('express');
const userController = require('./../controllers/auth');
const { protect, restrictTo } = require('./../controllers/auth');
const router = express.Router();

router.post('/interaction', userController.interaction);

router.post('/verifyEmail', userController.verifyEmail);

router.post(
  '/resendEmailVerificationCode',
  userController.resendEmailVerificationCode
);

router.post(
  '/confirmEmailVerificationCode',
  userController.confirmEmailVerificationCode
);

router.post('/signup', userController.signUp);
router.post('/signIn', userController.signIn);
router.get('/logout', protect, userController.logout);

router.get('/getUserData', protect, userController.getUserData);

// handling profile settings:
router.patch(
  '/updateUserData',
  protect,
  restrictTo('customer'),
  userController.updateUserData
);

router.patch(
  '/updateUserMobilePhone',
  protect,
  restrictTo('customer'),
  userController.updatePhoneNumber
);

router.patch(
  '/updateUserAddress',
  protect,
  restrictTo('customer'),
  userController.updateUserAddress
);

router.post('/forgetPassword', userController.forgetPassword);

router.post('/resendPasswordResetCode', userController.resendPasswordResetCode);

router.post(
  '/confirmPasswordResetCode',
  userController.confirmPasswordResetCode
);

router.post('/resetPassword', userController.resetPassword);

router.post('/changePassword', protect, userController.changePassword);

router.delete('/', protect, userController.deleteAccount);

module.exports = router;
