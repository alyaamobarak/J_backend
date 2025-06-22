const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    englishName: { type: String, required: true, unique: true },
    logo: {
      secure_url: String,
      public_id: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcategory',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Brand', BrandSchema);
