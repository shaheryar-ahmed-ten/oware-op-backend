const express = require('express');
const router = express.Router();
const { Category, User } = require('../models')
const { Op } = require("sequelize");
const config = require('../config');

/* GET categories listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search) where.name = { [Op.like]: '%' + req.query.search + '%' };
  const categories = await Category.findAndCountAll({
    include: [{ model: User }],
    orderBy: [['createdAt', 'DESC']],
    limit, offset, where, raw: true
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    pages: Math.ceil(response.count / limit)
  });
});

/* POST create new category. */
router.post('/', async (req, res, next) => {
  let message = 'New category registered';
  let category;
  try {
    category = await Category.create({
      userId: req.userId,
      ...req.body
    });
  } catch (err) {
    message = err.errors.pop().message;
  }
  res.json({
    success: true,
    message,
    data: category
  });
});

/* PUT update existing category. */
router.put('/:id', async (req, res, next) => {
  let category = await Category.findOne({ where: { id: req.params.id } });
  if (category) {
    res.json({
      success: true,
      message: 'Category updated',
      data: category
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No category found!'
    })
  }
});

module.exports = router;
