const express = require('express');
const router = express.Router();
const { Category } = require('../models')

/* GET categories listing. */
router.get('/', async (req, res, next) => {
  const categories = await Category.findAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }]
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
