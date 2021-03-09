const express = require('express');
const router = express.Router();
const { Brand, User } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");

/* GET brands listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.body.search) where.name = { [Op.like]: '%' + req.body.search + '%' };
  const response = await Brand.findAndCountAll({
    include: [{ model: User }],
    orderBy: [['createdAt', 'DESC']],
    where, limit, offset, raw: true
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
