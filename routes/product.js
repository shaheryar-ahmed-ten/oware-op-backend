const express = require('express');
const router = express.Router();
const { Product, User, Brand, UOM, Category } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");

/* GET products listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['name'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await Product.findAndCountAll({
    include: [{ model: User }, { model: UOM }, { model: Category }, { model: Brand }],
    orderBy: [['updatedAt', 'DESC']],
    where, limit, offset
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    pages: Math.ceil(response.count / limit)
  });
});

/* POST create new product. */
router.post('/', async (req, res, next) => {
  let message = 'New product registered';
  let product;
  try {
    product = await Product.create({
      userId: req.userId,
      ...req.body
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
  }
  res.json({
    success: true,
    message,
    data: product
  });
});

/* PUT update existing product. */
router.put('/:id', async (req, res, next) => {
  let product = await Product.findOne({ where: { id: req.params.id } });
  if (!product) return res.status(400).json({
    success: false,
    message: 'No product found!'
  });
  product.name = req.body.name;
  product.description = req.body.description;
  product.dimensionsCBM = req.body.dimensionsCBM;
  product.weight = req.body.weight;
  product.categoryId = req.body.categoryId;
  product.brandId = req.body.brandId;
  product.uomId = req.body.uomId;
  product.isActive = req.body.isActive;
  const response = await product.save();
  return res.json({
    success: true,
    message: 'User updated',
    data: response
  });
});

router.delete('/:id', async (req, res, next) => {
  let response = await Product.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'Product deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No product found!'
  });
})

router.get('/relations', async (req, res, next) => {
  let where = { isActive: true };
  const brands = await Brand.findAll({ where });
  const uoms = await UOM.findAll({ where });
  const categories = await Category.findAll({ where });
  res.json({
    success: true,
    message: 'respond with a resource',
    brands, uoms, categories
  });
});

module.exports = router;
