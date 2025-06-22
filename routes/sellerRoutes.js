const express = require('express');
const passport = require('../config/passport');
const sellerController = require('./../controllers/sellerController');
const { protect, restrictTo } = require('./../controllers/auth');
const router = express.Router();

router.post(
  '/initiateSellerRegistration',
  sellerController.initiateSellerRegistration
);

router.post(
  '/resendEmailVerificationCode',
  sellerController.resendEmailVerificationCode
);

router.post(
  '/confirmEmailVerificationCode',
  sellerController.confirmEmailVerificationCode
);

router.post('/completeSignUp', sellerController.completeSignUp);

router.post('/emailLogin', sellerController.loginByEmail);

router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['email', 'profile'],
    session: false,
    prompt: 'select_account',
  })
);

router.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      return res.send(`
          <script>
            window.opener.postMessage(
              { error: "Authentication error occurred" },
              "http://localhost:4200"
            );
            window.close();
          </script>
        `);
    }

    if (!user) {
      return res.send(`
          <script>
            window.opener.postMessage(
              { error: "${info?.message || 'Please signup first'}" },
              "http://localhost:4200"
            );
            window.close();
          </script>
        `);
    }

    // Success case
    res.send(`
        <script>
          window.opener.postMessage(
            { token: "${user.token}" },
            "http://localhost:4200"
          );
          window.close();
        </script>
      `);
  })(req, res, next);
});

router.get('/auth/google/failure', (req, res) => {
  res.send(`
    <script>
      window.opener.postMessage(
        { error: "Please signup first" },
        "http://localhost:4200"
      );
      window.close();
    </script>
  `);
});

router.get(
  '/orders',
  protect,
  restrictTo('seller'),
  sellerController.getSellerOrders
);

// get completed orders:
router.get(
  '/completedOrders',
  protect,
  restrictTo('seller'),
  sellerController.getSellerCompletedOrders
);

module.exports = router;
