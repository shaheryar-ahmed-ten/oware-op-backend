const express = require('express');
const router = express.Router();
const { Category, User } = require('../models')
const { Op } = require("sequelize");
const config = require('../config');

/* GET categories listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['name'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await Category.findAndCountAll({
    include: [{ model: User }],
    orderBy: [['updatedAt', 'DESC']],
    limit, offset, where
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
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
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
  if (!category) return res.status(400).json({
    success: false,
    message: 'No category found!'
  });
  category.name = req.body.name;
  category.isActive = req.body.isActive;
  try {
    const response = await category.save();
    return res.json({
      success: true,
      message: 'Category updated',
      data: response
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
  }
});

router.delete('/:id', async (req, res, next) => {
  let response = await Category.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'Category deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No category found!'
  });
})

module.exports = router;
