const express = require('express');
const router = express.Router();
const { Inventory, Customer, Warehouse, Product, UOM, sequelize } = require('../models')
const config = require('../config');
const { Op, QueryTypes, literal } = require("sequelize");

/* GET inventory listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['product', 'customer', 'warehouse']
    .map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));

  const response = await Inventory.findAll({
    attributes: ['product', 'customer', 'warehouse', 'uom', 'customerId', 'warehouseId',
                    'productId', 'quantity', 'committedQuantity', 'dispatchedQuantity'],
    raw: true,
    paranoid: false,
    where, limit, offset
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response,
    pages: Math.ceil(response.count / limit)
  });
});

module.exports = router;
