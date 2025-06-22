const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const Seller = require('./../models/sellerModel');
const jwt = require('jsonwebtoken');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/v1/sellers/auth/google/callback',
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
      try {
        if (!profile?.emails?.[0]?.value) {
          return done(null, false, {
            message: 'No email found in Google profile',
          });
        }

        const userEmail = profile.emails[0].value;
        const seller = await Seller.findOne({ email: userEmail });

        if (!seller) {
          return done(null, false, { message: 'Please signup first' });
        }

        const token = jwt.sign(
          { id: seller._id, role: 'seller' },
          process.env.JWT_SECRETKEY,
          {
            expiresIn: process.env.JWK_EXPIRES,
          }
        );

        return done(null, { seller, token });
      } catch (err) {
        return done(null, false, { message: err.message });
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;
