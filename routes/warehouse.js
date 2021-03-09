const express = require('express');
const router = express.Router();
const { Warehouse, User } = require('../models')
const { Op } = require("sequelize");
const config = require('../config');

/* GET warehouses listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search) where.name = { [Op.like]: '%' + req.query.search + '%' };
  const warehouses = await Warehouse.findAndCountAll({
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

/* POST create new warehouse. */
router.post('/', async (req, res, next) => {
  let message = 'New warehouse registered';
  let warehouse;
  try {
    warehouse = await Warehouse.create({
      userId: req.userId,
      ...req.body
    });
  } catch (err) {
    message = err.errors.pop().message;
  }
  res.json({
    success: true,
    message,
    data: warehouse
  });
});

/* PUT update existing warehouse. */
router.put('/:id', async (req, res, next) => {
  let warehouse = await Warehouse.findOne({ where: { id: req.params.id } });
  if (warehouse) {
    res.json({
      success: true,
      message: 'Warehouse updated',
      data: warehouse
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No warehouse found!'
    })
  }
});

module.exports = router;
