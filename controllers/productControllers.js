const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Product = require('./../models/productModel');
const Category = require('../models/categoryModel');
const Subcategory = require('../models/subcategoryModel');
const User = require('../models/userModel');

const cloudinary = require('../utils/cloudinary.config.js');

const Brand = require('../models/brandModel');

exports.createProduct = [
  catchAsync(async (req, res, next) => {
    const sellerId = req.user._id;

    const imagesUpload = await Promise.all(
      req.files.map(async file => {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          file.path,
          {
            folder: 'Products',
          }
        );
        return { public_id, secure_url };
      })
    );

    let specifications = {};
    try {
      if (req.body.specifications) {
        specifications = JSON.parse(req.body.specifications);
      }
    } catch (err) {
      console.error('Error parsing specifications:', err);
    }

    const {
      name,
      description,
      price,
      category,
      subcategory,
      stock,
      ratings,
      brand,
    } = req.body;

    let brandId = null;
    if (brand) {
      const brandDoc = await Brand.findById(brand);
      if (!brandDoc) {
        return res.status(404).json({ message: 'Brand not found' });
      }
      brandId = brandDoc._id;
    }

    const product = new Product({
      name,
      description,
      price,
      category: category || null,
      subcategory: subcategory || null,
      seller: sellerId,
      stock: stock || 0,
      ratings: ratings || 0,
      specifications,
      images: imagesUpload,
      brand: brandId,
    });

    await product.save();

    const populatedProduct = await product.populate('brand', 'name');

    return res.status(201).json({
      message: 'Product created successfully',
      product: populatedProduct,
    });
  }),
];

// Create many products with image upload
exports.createManyProducts = [
  catchAsync(async (req, res, next) => {
    let products;
    try {
      products = JSON.parse(req.body.products);
    } catch (err) {
      return next(new AppError(400, 'Invalid JSON format for products'));
    }

    if (!Array.isArray(products)) {
      return next(
        new AppError(400, 'Request body must be an array of products')
      );
    }
    const sellerId = req.user._id;
    const validatedProducts = [];

    const imagesMap = req.files?.reduce((acc, file) => {
      const [productIndex] = file.originalname.split('__');
      if (!acc[productIndex]) acc[productIndex] = [];
      acc[productIndex].push(file);
      return acc;
    }, {});

    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      const {
        name,
        description,
        price,
        category,
        subcategory,
        stock,
        ratings,
        specifications,
      } = productData;

      if (!name || !description || !price) {
        return next(
          new AppError(
            400,
            `Product ${i + 1} must include name, description, and price`
          )
        );
      }

      if (category && !(await Category.findById(category))) {
        return next(
          new AppError(404, `Category not found for product: ${name}`)
        );
      }
      if (subcategory && !(await Subcategory.findById(subcategory))) {
        return next(
          new AppError(404, `Subcategory not found for product: ${name}`)
        );
      }

      let uploadedImages = [];
      if (imagesMap?.[i]) {
        uploadedImages = await Promise.all(
          imagesMap[i].map(async file => {
            const { secure_url, public_id } = await cloudinary.uploader.upload(
              file.path,
              {
                folder: 'Products',
              }
            );
            return { public_id, secure_url };
          })
        );
      }
      let parsedSpecs = {};
      try {
        parsedSpecs =
          specifications && typeof specifications === 'string'
            ? JSON.parse(specifications)
            : specifications || {};
      } catch (err) {
        return next(
          new AppError(400, `Invalid specifications for product: ${name}`)
        );
      }

      validatedProducts.push({
        name,
        description,
        price,
        category: category || null,
        subcategory: subcategory || null,
        stock: stock || 0,
        ratings: ratings || 0,
        seller: sellerId,
        specifications: parsedSpecs,
        images: uploadedImages,
      });
    }

    const createdProducts = await Product.insertMany(validatedProducts);

    res.status(201).json({
      message: 'Products created successfully',
      products: createdProducts,
    });
  }),
];

exports.getAllProducts = catchAsync(async (req, res, next) => {
  let queryObj = {};

  console.log('Query Object (Before Filtering):', req.query);

  if (req.query.search) {
    queryObj.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  if (req.query.category) queryObj.category = req.query.category;
  if (req.query.subcategory) queryObj.subcategory = req.query.subcategory;
  if (req.query.seller) queryObj.seller = req.query.seller;

  if (req.query.brandName) {
    const brand = await Brand.findOne({ name: req.query.brandName });
    if (brand) {
      queryObj.brand = brand._id;
    } else {
      return next(new AppError(404, 'Brand not found'));
    }
  }

  if (req.query.brand) queryObj.brand = req.query.brand;

  if (req.query.minPrice || req.query.maxPrice) {
    queryObj.price = {};
    if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
  }

  if (req.query.minRating || req.query.maxRating) {
    queryObj.ratings = {};
    if (req.query.minRating)
      queryObj.ratings.$gte = Number(req.query.minRating);
    if (req.query.maxRating)
      queryObj.ratings.$lte = Number(req.query.maxRating);
  }

  if (req.query.inStock === 'true') queryObj.stock = { $gt: 0 };

  console.log('Query Object (After Filtering):', queryObj);

  let query = Product.find(queryObj)
    .populate('category')
    .populate('subcategory')
    .populate('seller')
    .populate('brand');

  if (req.query.sort) {
    query = query.sort(req.query.sort.split(',').join(' '));
  } else {
    query = query.sort('-createdAt');
  }

  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  const products = await query;

  if (products.length === 0) {
    return next(new AppError(404, 'No products found matching your criteria'));
  }

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});

//  Get a single product by ID
exports.getProductById = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const product = await Product.findById(productId)
    .populate('category')
    .populate('subcategory')
    .populate('seller');

  if (!product) {
    return next(new AppError(404, 'Product not found'));
  }

  res.status(200).json({ product });
});

//  Update a product
exports.updateProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const updates = req.body;

  const product = await Product.findByIdAndUpdate(productId, updates, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError(404, 'Product not found'));
  }

  res.status(200).json({ message: 'Product updated successfully', product });
});

//  Delete a product
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const product = await Product.findByIdAndDelete(productId);

  if (!product) {
    return next(new AppError(404, 'Product not found'));
  }

  res.status(200).json({ message: 'Product deleted successfully' });
});

//  Get products by category
exports.getProductsByCategory = catchAsync(async (req, res, next) => {
  const categoryId = req.params.categoryId;
  const products = await Product.find({ category: categoryId })
    .populate('category')
    .populate('subcategory');

  if (products.length === 0) {
    return next(new AppError(404, 'No products found for this category'));
  }

  res.status(200).json({ products });
});

//  Get products by subcategory
exports.getProductsBySubcategory = catchAsync(async (req, res, next) => {
  const subcategoryId = req.params.subcategoryId;
  const products = await Product.find({ subcategory: subcategoryId })
    .populate('category')
    .populate('subcategory');

  if (products.length === 0) {
    return next(new AppError(404, 'No products found for this subcategory'));
  }

  res.status(200).json({ products });
});

exports.getSellerProducts = catchAsync(async (req, res, next) => {
  const { _id: seller } = req.user;
  const products = await Product.find({ seller });
  res.status(200).json({
    status: 'success',
    data: {
      products,
    },
  });
});
