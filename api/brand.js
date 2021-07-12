const express = require('express');
const router = express.Router();
const { Brand, User } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");

/* GET brands listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['name'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await Brand.findAndCountAll({
    include: [{ model: User }],
    order: [['updatedAt', 'DESC']],
    where, limit, offset
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    pages: Math.ceil(response.count / limit)
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
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
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
  if (!brand) return res.status(400).json({
    success: false,
    message: 'No brand found!'
  });
  brand.name = req.body.name;
  brand.manufacturerName = req.body.manufacturerName;
  brand.isActive = req.body.isActive;
  try {
    const response = await brand.save();
    return res.json({
      success: true,
      message: 'Brand updated',
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
  let response = await Brand.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'Brand deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No brand found!'
  });
})

module.exports = router;
