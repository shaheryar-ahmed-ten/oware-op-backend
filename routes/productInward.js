const express = require('express');
const router = express.Router();
const { Inventory, ProductInward, User, Customer, Warehouse, Product, UOM } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");

/* GET productInwards listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['Product.name'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await ProductInward.findAndCountAll({
    include: [{ model: User }, { model: Product, include: [{ model: UOM }] }, { model: Customer }, { model: Warehouse }],
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

/* POST create new productInward. */
router.post('/', async (req, res, next) => {
  let message = 'New productInward registered';
  let productInward;
  try {
    productInward = await ProductInward.create({
      userId: req.userId,
      ...req.body
    });
  } catch (err) {
    message = err.errors.pop().message;
  }
  res.json({
    success: true,
    message,
    data: productInward
  });
});

/* PUT update existing productInward. */
router.put('/:id', async (req, res, next) => {
  let productInward = await ProductInward.findOne({ where: { id: req.params.id } });
  if (!productInward) return res.status(400).json({
    success: false,
    message: 'No productInward found!'
  });
  const quantityDifference = req.body.quantity - productInward.quantity;
  productInward.customerId = req.body.customerId;
  productInward.warehouseId = req.body.warehouseId;
  productInward.productId = req.body.productId
  productInward.isActive = req.body.isActive;
  const response = await productInward.save();
  return res.json({
    success: true,
    message: 'User updated',
    data: response
  });
});

router.delete('/:id', async (req, res, next) => {
  let response = await ProductInward.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'ProductInward deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No productInward found!'
  });
})

router.get('/relations', async (req, res, next) => {
  const customers = await Customer.findAll();
  const products = await Product.findAll({ include: [{ model: UOM }] });
  const warehouses = await Warehouse.findAll();
  const inventories = await Inventory.findAll({
    attributes: ['customerId', 'warehouseId', 'productId', 'quantity', 'committedQuantity', 'dispatchedQuantity'],
    raw: true,
    paranoid: false,
    include: [{ model: Customer }, { model: Warehouse }, { model: Product }]
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    customers, products, warehouses, inventories
  });
});

module.exports = router;
