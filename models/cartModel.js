const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    cartTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.pre('save', async function (next) {
  const cart = this;
  let total = 0;

  for (const item of cart.items) {
    const product = await mongoose.model('Product').findById(item.product);
    if (product) {
      total += product.price * item.quantity;
    }
  }

  cart.cartTotal = total;
  next();
});

cartSchema.methods.updateCartTotal = async function () {
  let total = 0;

  for (const item of this.items) {
    const product = await mongoose.model('Product').findById(item.product);
    if (product) {
      total += product.price * item.quantity;
    }
  }

  this.cartTotal = total;
  await this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
