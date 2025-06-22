const express = require('express');
const {
  getProductsBySubcategory,
  getProductsByCategory,
  deleteProduct,
  updateProduct,
  getProductById,
  getAllProducts,
  createProduct,
  createManyProducts,
  getSellerProducts,
} = require('../controllers/productControllers.js');
const { protect, restrictTo } = require('../controllers/auth.js');
const { uploadCloud } = require('../utils/multer.cloud.js');
const router = express.Router();

router.post(
  '/',
  protect,
  restrictTo('seller'),
  uploadCloud().array('images', 5),
  createProduct
);

router.post(
  '/',
  protect,
  restrictTo('seller'),
  uploadCloud().any(),
  createManyProducts
);

router.get(
  '/getSellerProducts',
  protect,
  restrictTo('seller'),
  getSellerProducts
);

router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', protect, restrictTo('seller'), updateProduct);
router.delete('/:id', protect, restrictTo('seller'), deleteProduct);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/subcategory/:subcategoryId', getProductsBySubcategory);
module.exports = router;
