const express = require('express');
const router = express.Router();
const { Warehouse } = require('../models')
const { Op } = require("sequelize");

/* GET warehouses listing. */
router.get('/', async (req, res, next) => {
  const limit = req.body.rowsPerPage || config.rowsPerPage
  const offset = (req.body.page || 0) * limit;
  let where = {};
  if (req.body.search) where.name = { [Op.like]: '%' + req.body.search + '%' };
  const warehouses = await Warehouse.findAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }],
    orderBy: [['createdAt', 'DESC']],
    limit, offset, where, raw: true
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: warehouses
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
