const mongoose = require('mongoose');

const tempSellerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  verificationCode: Number,
  verificationCodeExpiresIn: Date,
});

module.exports = mongoose.model('TempSeller', tempSellerSchema);
