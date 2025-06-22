const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const Subcategory = require('./../models/subcategoryModel');

exports.addNewSubCategory = catchAsync(async (req, res, next) => {
  const { subcategoryName, categoryId, englishName } = req.body;
  if (!subcategoryName || !categoryId || !englishName)
    return next(
      new AppError(
        400,
        'enter the subcategoryName and englishName and categoryId'
      )
    );

  const subcategory = await Subcategory.create({
    name: subcategoryName,
    category: categoryId,
    englishName,
  });

  res.status(201).json({
    status: 'success',
    data: {
      subcategory,
    },
  });
});

exports.getSubcategoriesForAddingProduct = catchAsync(
  async (req, res, next) => {
    const subcategories = await Subcategory.find().select('name');
    res.status(200).json({
      status: 'success',
      data: {
        subcategories,
      },
    });
  }
);

exports.getAllSubcategories = catchAsync(async (req, res, next) => {
  const subcategories = await Subcategory.find().populate({
    path: 'category',
    select: 'name englishName description',
  });

  res.status(200).json({
    status: 'success',
    data: {
      subcategories,
    },
  });
});

exports.getSubcategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const subcategory = await Subcategory.findById(id).populate({
    path: 'category',
    select: 'name englishName description',
  });

  if (!subcategory)
    return next(new AppError(404, 'there is no subcategory with this id'));

  res.status(200).json({
    status: 'success',
    data: {
      subcategory,
    },
  });
});

exports.updateSubcategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { subcategoryName, englishName, categoryId } = req.body;
  if (!subcategoryName || englishName || categoryId)
    return next(
      new AppError(
        400,
        'Please provide subcategory name or englishName or category to update'
      )
    );
  const updatedSubcategory = await Subcategory.findByIdAndUpdate(
    id,
    {
      name: subcategoryName,
      category: categoryId,
    },
    { new: true }
  );

  if (!updatedSubcategory)
    return next(new AppError(404, 'there is no subcategory with this id'));

  res.status(200).json({
    status: 'success',
    data: {
      updatedSubcategory,
    },
  });
});

exports.deleteSubCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const deletedSubCategory = await Subcategory.findByIdAndDelete(id);
  if (!deletedSubCategory)
    return next(new AppError(404, 'there is no subcategory with this id'));

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
