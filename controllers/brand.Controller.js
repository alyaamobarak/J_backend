const Brand = require('../models/brandModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const slugify = require('slugify');

const cloudinary = require('../utils/cloudinary.config.js');
// create new brand
exports.createBrand = catchAsync(async (req, res, next) => {
  const { name, category, subcategory, englishName } = req.body;

  if (!name) {
    return next(new AppError(400, 'Brand name is required.'));
  }

  if (!req.file) {
    return next(new AppError(400, 'Brand logo is required.'));
  }

  const slug = slugify(name, { lower: true });

  // Upload logo image
  let uploadedLogo;
  try {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: 'Brands',
      }
    );
    uploadedLogo = { public_id, secure_url };
  } catch (err) {
    return next(new AppError(500, 'Failed to upload brand logo.'));
  }

  // Create brand
  const newBrand = await Brand.create({
    name,
    englishName,
    slug,
    logo: uploadedLogo,
    category: category || null,
    subcategory: subcategory || null,
  });

  res.status(201).json({
    status: 'success',
    data: newBrand,
  });
});

//  Get all brands with search and sorting

exports.getAllBrands = catchAsync(async (req, res, next) => {
  let query = Brand.find();

  //  Search functionality
  if (req.query.search) {
    query = query.find({ name: { $regex: req.query.search, $options: 'i' } });
  }
  //Sorting
  if (req.query.sort) {
    query = query.sort(req.query.sort);
  } else {
    query = query.sort('name');
  }

  const brands = await query;

  res.status(200).json({
    status: 'success',
    results: brands.length,
    data: brands,
  });
});

// Get a brand by ID or slug
const mongoose = require('mongoose');

exports.getBrandByIdOrSlug = catchAsync(async (req, res, next) => {
  const { idOrSlug } = req.params;

  let query = mongoose.Types.ObjectId.isValid(idOrSlug)
    ? { _id: idOrSlug } // Serach by id
    : { slug: idOrSlug }; // Search by slug

  const brand = await Brand.findOne(query);

  if (!brand) {
    return next(new AppError(404, 'Brand not found.'));
  }

  res.status(200).json({
    status: 'success',
    data: brand,
  });
});

exports.updateBrand = catchAsync(async (req, res, next) => {
  const { idOrSlug } = req.params;

  let brand = await Brand.findOne({
    $or: [{ _id: idOrSlug }, { slug: idOrSlug }],
  }).exec();

  if (!brand) {
    return next(new AppError(404, 'Brand not found.'));
  }

  if (req.body.name) {
    brand.name = req.body.name;
    brand.slug = slugify(req.body.name, { lower: true });
  }
  if (req.body.logo) {
    brand.logo = req.body.logo;
  }

  await brand.save();
  res.status(200).json({
    status: 'success',
    message: 'Brand updated successfully',
    data: brand,
  });
});

//delete by id or slug
exports.deleteBrand = catchAsync(async (req, res, next) => {
  const { idOrSlug } = req.params;

  const brand = await Brand.findOneAndDelete({
    $or: [{ _id: idOrSlug }, { slug: idOrSlug }],
  });

  if (!brand) {
    return next(new AppError(404, 'Brand not found.'));
  }

  res.status(200).json({
    success: true,
    message: 'Brand deleted successfully',
  });
});

// getting brands for adding products
exports.getBrandsForAddingProduct = catchAsync(async (req, res, next) => {
  const brands = await Brand.find().select('name');
  res.status(200).json({
    status: 'success',
    data: {
      brands,
    },
  });
});
