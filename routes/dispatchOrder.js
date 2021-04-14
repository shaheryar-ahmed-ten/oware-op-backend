const express = require('express');
const router = express.Router();
const { Inventory, DispatchOrder, ProductOutward, User, Customer, Warehouse, Product, UOM } = require('../models');
const config = require('../config');
const { Op } = require("sequelize");
const authService = require('../services/auth.service');

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
    }],
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
    message: 'Inventory is not available'
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
  let where = { isActive: true };
  
  const warehouses = await Warehouse.findAll({ where });
  const products = await Product.findAll({ where, include: [{ model: UOM }] });

  if (!authService.isSuperAdmin(req)) where.contactId = req.userId;
  const customers = await Customer.findAll({ where });
  res.json({
    success: true,
    message: 'respond with a resource',
    customers, warehouses, products
  });
});

router.get('/inventory', async (req, res, next) => {
  if (req.query.customerId && req.query.warehouseId && req.query.productId) {
    const inventory = await Inventory.findOne({
      where: {
        customerId: req.query.customerId,
        warehouseId: req.query.warehouseId,
        productId: req.query.productId
      }
    })
    res.json({
      success: true,
      message: 'respond with a resource',
      inventory
    });
  } else res.json({
    success: false,
    message: 'No inventory found'
  })
});

module.exports = router;
