const express = require('express');
const router = express.Router();
const { Brand } = require('../models')

/* GET brands listing. */
router.get('/', async (req, res, next) => {
  const brands = await Brand.findAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }]
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: brands
  });
});

/* POST create new brand. */
router.post('/', async (req, res, next) => {
  let message = 'New brand registered';
  let brand;
  try {
    brand = await Brand.create({
      userId: req.userId,
      ...req.body
    });
  } catch (err) {
    message = err.errors.pop().message;
  }
  res.json({
    success: true,
    message,
    data: brand
  });
});

/* PUT update existing brand. */
router.put('/:id', async (req, res, next) => {
  let brand = await Brand.findOne({ where: { id: req.params.id } });
  if (brand) {
    res.json({
      success: true,
      message: 'Brand updated',
      data: brand
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No brand found!'
    })
  }
});

module.exports = router;
