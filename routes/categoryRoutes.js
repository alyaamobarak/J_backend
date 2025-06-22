const express = require('express');
const categoryControllers = require('./../controllers/categoryControllers');
const { protect, restrictTo } = require('./../controllers/auth');
const router = express.Router();

router.post(
  '/',
  // protect,
  // restrictTo('admin', 'seller'),
  categoryControllers.addNewCategory
);

router.get('/', categoryControllers.getAllCategories);
router.get(
  '/getCategoriesForAddingProduct',
  categoryControllers.getCategoriesForAddingProduct
);

router.get('/:id', categoryControllers.getCategoryById);

router.delete(
  '/:id',
  protect,
  restrictTo('admin'),
  categoryControllers.deleteCategoryById
);

router.patch(
  '/:id',
  protect,
  restrictTo('admin', 'seller'),
  categoryControllers.updateCategory
);

module.exports = router;
