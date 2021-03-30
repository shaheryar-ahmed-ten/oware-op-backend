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
  if (req.query.search) where[Op.or] = ['$Product.name$', '$Customer.companyName$', '$Warehouse.name$']
    .map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));

  const response = await Inventory.findAndCountAll({
    include: [{ model: Product, include: [{ model: UOM }] }, { model: Customer }, { model: Warehouse }],
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

/* GET inventory export. */
router.get('/export', async (req, res, next) => {
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['$Product.name$', '$Customer.companyName$', '$Warehouse.name$']
    .map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));

  const response = await Inventory.findAndCountAll({
    include: [{ model: Product, include: [{ model: UOM }] }, { model: Customer }, { model: Warehouse }],
    orderBy: [['updatedAt', 'DESC']],
    where
  });
  const headers = ['PRODUCT NAME', 'CUSTOMER', 'WAREHOUSE', 'UOM', 'AVAILABLE QUANTITY', 'COMMITTED QUANTITY', 'DISPATCHED QUANTITY'];
  const data = response.rows.map(row => [
    row.Product.name,
    row.Customer.companyName,
    row.Warehouse.name,
    row.Product.UOM.name,
    row.availableQuantity,
    row.committedQuantity,
    row.dispatchedQuantity
  ]);
  res.csv([headers, ...data]);
});

module.exports = router;
