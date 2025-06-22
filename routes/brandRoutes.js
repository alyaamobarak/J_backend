const express = require('express');
const {
  createBrand,
  getAllBrands,
  getBrandByIdOrSlug,
  updateBrand,
  deleteBrand,
  getBrandsForAddingProduct,
} = require('../controllers/brand.Controller.js');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const { uploadCloud } = require('../utils/multer.cloud.js');

const router = express.Router();
const upload = uploadCloud();
router.get('/', getAllBrands);
router.get('/getBrandsForAddingProduct', getBrandsForAddingProduct);
router.post('/', upload.single('logo'), createBrand);

router.get('/:idOrSlug', getBrandByIdOrSlug);
router.patch('/:idOrSlug', protect, restrictTo('admin'), updateBrand);
router.delete('/:idOrSlug', protect, restrictTo('admin'), deleteBrand);

module.exports = router;
