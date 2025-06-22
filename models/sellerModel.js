const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    unique: true,
    required: true,
  },
  phone: {
    type: String,
    unique: true,
    required: true,
  },
  accountType: {
    type: String,
    required: true,
  },
  storeName: {
    type: String,
    unique: true,
    required: true,
  },
  shippingArea: {
    type: String,
    required: true,
  },
  accountBalance: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    default: 'seller',
  },
  country: {
    type: String,
    required: true,
  },
  listenAboutJumiaFrom: {
    type: String,
    required: true,
  },
  passwordResetCode: Number,
  passwordResetCodeExpireDate: Date,
  allowedToResetPassword: Boolean,
  passwordChangedAt: Date,
}, { timestamps: true });

sellerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
module.exports = mongoose.model('Seller', sellerSchema);
