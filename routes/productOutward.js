const express = require('express');
const router = express.Router();
const { ProductOutward, DispatchOrder, ProductInward, User, Customer, Warehouse, Product, UOM } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");

/* GET productOutwards listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['DispatchOrder.ProductInward.Product.name'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await ProductOutward.findAndCountAll({
    include: [
      { model: User },
      {
        model: DispatchOrder,
        include: [{ model: User }, { model: Product, include: [{ model: UOM }] }, { model: Customer }, { model: Warehouse }],
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

/* POST create new productOutward. */
router.post('/', async (req, res, next) => {
  let message = 'New productOutward registered';
  let productOutward;
  try {
    productOutward = await ProductOutward.create({
      userId: req.userId,
      ...req.body
    });
  } catch (err) {
    message = err;
  }
  res.json({
    success: true,
    message,
    data: productOutward
  });
});

/* PUT update existing productOutward. */
router.put('/:id', async (req, res, next) => {
  let productOutward = await ProductOutward.findOne({ where: { id: req.params.id }, include: [{ model: ProductInward }] });
  if (!productOutward) return res.status(400).json({
    success: false,
    message: 'No productOutward found!'
  });
  await productOutward.ProductInward.save();
  productOutward.receiverName = req.body.receiverName;
  productOutward.receiverPhone = req.body.receiverPhone;
  productOutward.isActive = req.body.isActive;
  const response = await productOutward.save();
  return res.json({
    success: true,
    message: 'User updated',
    data: response
  });
});

router.delete('/:id', async (req, res, next) => {
  let response = await ProductOutward.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'ProductOutward deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No productOutward found!'
  });
})

router.get('/relations', async (req, res, next) => {
  const dispatchOrders = await DispatchOrder.findAll({
    include: [{ model: User }, { model: Product, include: [{ model: UOM }] }, { model: Customer }, { model: Warehouse }]
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    dispatchOrders
  });
});

module.exports = router;
