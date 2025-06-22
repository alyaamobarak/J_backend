const Category = require('./../models/categoryModel');
const Subcategory = require('./../models/subcategoryModel');
const Brand = require('./../models/brandModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.addNewCategory = catchAsync(async (req, res, next) => {
  const { name, description, englishName } = req.body;

  if (!name || !description || !englishName) {
    return next(
      new AppError(
        400,
        'enter the name and description and englishName of category'
      )
    );
  }

  const category = await Category.create({ name, description, englishName });

  res.status(201).json({
    status: 'success',
    data: {
      category,
    },
  });
});

exports.getCategoriesForAddingProduct = catchAsync(async (req, res, next) => {
  const categories = await Category.find().select('name');
  res.status(200).json({
    status: 'success',
    data: {
      categories,
    },
  });
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find().select(
    'name description englishName'
  );

  const categoriesWithDetails = await Promise.all(
    categories.map(async category => {
      const subcategories = await Subcategory.find({
        category: category._id,
      }).select('name englishName');
      const brands = await Brand.find({ category: category._id }).select(
        'name englishName logo'
      );

      return {
        _id: category._id,
        name: category.name,
        englishName: category.englishName,
        description: category.description,
        subcategories,
        brands,
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      categories: categoriesWithDetails,
    },
  });
});

exports.getCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const category = await Category.findById(id).select(
    'name englishName description'
  );

  if (!category) {
    return next(new AppError(404, 'There is no category with this ID'));
  }

  const subcategories = await Subcategory.find({ category: id }).select(
    'name englishName'
  );

  const brands = await Brand.find({ category: id }).select(
    'name englishName logo'
  );

  res.status(200).json({
    status: 'success',
    data: {
      category,
      subcategories,
      brands,
    },
  });
});

exports.deleteCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const deletedCategory = await Category.findByIdAndDelete(id);
  if (!deletedCategory)
    return next(new AppError(404, 'there is no category with this id'));
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;
  if (!name || !description)
    return next(
      new AppError(400, 'Please provide name or description to update')
    );

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    {
      name,
      description,
    },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      updatedCategory,
    },
  });
});
