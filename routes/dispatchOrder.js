const express = require('express');
const router = express.Router();
const { DispatchOrder, ProductInward, User, Customer, Warehouse, Product, UOM } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");

/* GET dispatchOrders listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['ProductInward.Product.name'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await DispatchOrder.findAndCountAll({
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

/* POST create new dispatchOrder. */
router.post('/', async (req, res, next) => {
  let message = 'New dispatchOrder registered';
  let dispatchOrder;
  try {
    dispatchOrder = await DispatchOrder.create({
      userId: req.userId,
      ...req.body
    });
  } catch (err) {
    console.log(err)
    message = err;
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
  dispatchOrder.receiverName = req.body.receiverName;
  dispatchOrder.receiverPhone = req.body.receiverPhone;
  dispatchOrder.isActive = req.body.isActive;
  const response = await dispatchOrder.save();
  return res.json({
    success: true,
    message: 'User updated',
    data: response
  });
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
  const customers = await Customer.findAll();
  const products = await Product.findAll({ include: [{ model: UOM }] });
  const warehouses = await Warehouse.findAll();
  res.json({
    success: true,
    message: 'respond with a resource',
    customers, products, warehouses
  });
});

module.exports = router;
