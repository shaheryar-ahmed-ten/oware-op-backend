const express = require('express');
const router = express.Router();
const { Warehouse } = require('../models')

/* GET warehouses listing. */
router.get('/', async (req, res, next) => {
  const warehouses = await Warehouse.findAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }]
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
