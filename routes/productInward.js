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
  if (req.query.search) where[Op.or] = ['$Product.name$', '$Customer.companyName$', '$Warehouse.name$'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
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
  let inventory = await Inventory.findOne({
    where: {
      customerId: req.body.customerId,
      warehouseId: req.body.warehouseId,
      productId: req.body.productId
    }
  });
  let productInward;
  try {
    if (!inventory) await Inventory.create({
      customerId: req.body.customerId,
      warehouseId: req.body.warehouseId,
      productId: req.body.productId,
      availableQuantity: req.body.quantity,
      totalInwardQuantity: req.body.quantity
    })
    else {
      inventory.availableQuantity += (+req.body.quantity);
      inventory.totalInwardQuantity += (+req.body.quantity);
      inventory.save();
    }
    productInward = await ProductInward.create({
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
  try {
    const response = await productInward.save();
    return res.json({
      success: true,
      message: 'Product Inward updated',
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
  let where = { isActive: true };
  const customers = await Customer.findAll({ where });
  const products = await Product.findAll({ where, include: [{ model: UOM }] });
  const warehouses = await Warehouse.findAll({ where });
  res.json({
    success: true,
    message: 'respond with a resource',
    customers, products, warehouses
  });
});

module.exports = router;
