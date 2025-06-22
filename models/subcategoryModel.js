const mongoose = require('mongoose');

const SubcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    englishName: { type: String, required: true, unique: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subcategory', SubcategorySchema);
