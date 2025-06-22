const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    mobilePhone: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ['customer', 'admin', 'seller'],
      default: 'customer',
    },
    address: {
      street: String,
      city: String,
      governorate: String,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },

    passwordResetCode: Number,
    passwordResetCodeExpireDate: Date,
    allowedToResetPassword: Boolean,
    passwordChangedAt: Date,

    isVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationCode: Number,
    emailVerificationCodeExpiresIn: Date,
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('User', UserSchema);
