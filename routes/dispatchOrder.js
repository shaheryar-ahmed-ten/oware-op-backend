const express = require('express');
const router = express.Router();
const { Inventory, DispatchOrder, ProductOutward, User, Customer, Warehouse, Product, UOM } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");

/* GET dispatchOrders listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['$Inventory.Product.name$', '$Inventory.Customer.companyName$', '$Inventory.Warehouse.name$']
    .map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await DispatchOrder.findAndCountAll({
    include: [{
      model: Inventory,
      include: [{ model: Product, include: [{ model: UOM }] }, { model: Customer }, { model: Warehouse }],
    }, { model: ProductOutward }],
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

/* POST create new dispatchOrder. */
router.post('/', async (req, res, next) => {
  let message = 'New dispatchOrder registered';
  let inventory = await Inventory.findByPk(req.body.inventoryId);
  if (!inventory && !req.body.inventoryId) return res.json({
    success: false,
    message: 'No inventory found'
  });
  if (req.body.quantity > inventory.availableQuantity) return res.json({
    success: false,
    message: 'Cannot create orders above available quantity'
  });
  inventory.committedQuantity += (+req.body.quantity);
  inventory.availableQuantity -= (+req.body.quantity);
  inventory.save();
  let dispatchOrder;
  try {
    dispatchOrder = await DispatchOrder.create({
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
    data: dispatchOrder
  });
});

/* PUT update existing dispatchOrder. */
router.put('/:id', async (req, res, next) => {
  let dispatchOrder = await DispatchOrder.findOne({ where: { id: req.params.id } });
  if (!dispatchOrder) return res.status(400).json({
    success: false,
    message: 'No dispatchOrder found!'
  });
  dispatchOrder.shipmentDate = req.body.shipmentDate;
  dispatchOrder.receiverName = req.body.receiverName;
  dispatchOrder.receiverPhone = req.body.receiverPhone;
  try {
    const response = await dispatchOrder.save();
    return res.json({
      success: true,
      message: 'Dispatch Order updated',
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
  let response = await DispatchOrder.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'DispatchOrder deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No dispatchOrder found!'
  });
})

router.get('/relations', async (req, res, next) => {
  const inventories = await Inventory.findAll({
    include: [{
      model: Customer
    },
    { model: Product, include: [{ model: UOM }] },
    { model: Warehouse }]
  })
  res.json({
    success: true,
    message: 'respond with a resource',
    inventories
  });
});

module.exports = router;
