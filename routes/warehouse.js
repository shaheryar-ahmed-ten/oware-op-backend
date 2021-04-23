const express = require('express');
const router = express.Router();
const { Warehouse, User } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");


function getWarehouseCode(id, city) {
  return `WH-${city.slice(0, 3).toUpperCase()}-${digitize(id, 3)}`
}

function digitize(value, places) {
  let strVal = (value + '');
  return new Array(places - strVal.length).fill('0').join('') + strVal;
}

/* GET warehouses listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['name'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await Warehouse.findAndCountAll({
    include: [{ model: User }],
    orderBy: [['updatedAt', 'DESC']],
    where, limit, offset
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
    warehouse.save();
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
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
  if (!warehouse) return res.status(400).json({
    success: false,
    message: 'No warehouse found!'
  });
  warehouse.name = req.body.name;
  warehouse.address = req.body.address;
  warehouse.city = req.body.city;
  warehouse.isActive = req.body.isActive;
  warehouse.businessWarehouseCode = req.body.businessWarehouseCode;
  try {
    const response = await warehouse.save();
    return res.json({
      success: true,
      message: 'Warehouse updated',
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
  let response = await Warehouse.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'Warehouse deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No warehouse found!'
  });
})

module.exports = router;
