const express = require('express');
const router = express.Router();
const { Product, User } = require('../models')
const { Op } = require("sequelize");
const config = require('../config');

/* GET products listing. */
router.get('/', async (req, res, next) => {
  const limit = req.body.rowsPerPage || config.rowsPerPage
  const offset = (req.body.page || 0) * limit;
  let where = {};
  if (req.body.search) where.name = { [Op.like]: '%' + req.body.search + '%' };
  const products = await Product.findAll({
    include: [{ model: User }],
    orderBy: [['createdAt', 'DESC']],
    limit, offset, where, raw: true
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: products
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
    message = err.errors.pop().message;
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
  if (product) {
    res.json({
      success: true,
      message: 'Product updated',
      data: product
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No product found!'
    })
  }
});

module.exports = router;
