require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('./config/passport');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRoutes = require('./routes/userRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');
const productRoutes = require('./routes/productRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const brandRoutes = require('./routes/brandRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const app = express();
app.use(morgan('dev'));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Private-Network', true);
  return next();
});

app.use(passport.initialize());

// handling our routes :
app.use("/api/v1", require("./routes/chatRoutes"))
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/sellers', sellerRoutes);
app.use('/api/v1/subcategories', subcategoryRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/carts', cartRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/payments', paymentRoutes);

// handling unhandled routes:
app.all('*', (req, res, next) => {
  return next(
    new AppError(404, `this route '${req.originalUrl}' does not on this server`)
  );
});

// global error handling
app.use(globalErrorHandler);
module.exports = app;
