const express = require('express');
const { protect, restrictTo } = require('./../controllers/auth');
const subcategoryController = require('./../controllers/subcategoryControllers');

const router = express.Router();

router.post(
  '/',
  // protect,
  // restrictTo('admin', 'seller'),
  subcategoryController.addNewSubCategory
);

router.get('/', subcategoryController.getAllSubcategories);
router.get(
  '/getSubcategoriesForAddingProduct',
  subcategoryController.getSubcategoriesForAddingProduct
);

router.get('/:id', subcategoryController.getSubcategoryById);

router.patch(
  '/:id',
  protect,
  restrictTo('admin', 'seller'),
  subcategoryController.updateSubcategory
);

router.delete(
  '/:id',
  protect,
  restrictTo('admin', 'seller'),
  subcategoryController.deleteSubCategory
);

module.exports = router;
