const express = require('express');
const router = express.Router();
const { Category } = require('../models')
const { Op } = require("sequelize");

/* GET categories listing. */
router.get('/', async (req, res, next) => {
  const limit = req.body.rowsPerPage || config.rowsPerPage
  const offset = (req.body.page || 0) * limit;
  let where = {};
  if (req.body.search) where.name = { [Op.like]: '%' + req.body.search + '%' };
  const categories = await Category.findAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }],
    orderBy: [['createdAt', 'DESC']],
    limit, offset, where, raw: true
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: categories
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
