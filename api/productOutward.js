const express = require('express');
const router = express.Router();
const { Inventory,
  ProductOutward,
  Vehicle,
  Car,
  CarMake,
  CarModel,
  DispatchOrder,
  ProductInward,
  Company,
  Warehouse,
  Product,
  UOM
} = require('../models')
const config = require('../config');
const { Op } = require("sequelize");
const { digitize } = require('../services/common.services');


/* GET productOutwards listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['$DispatchOrder.Inventory.Product.name$', '$DispatchOrder.Inventory.Company.name$', '$DispatchOrder.Inventory.Warehouse.name$']
    .map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await ProductOutward.findAndCountAll({
    include: [
      {
        model: DispatchOrder,
        include: [{
          model: Inventory,
          include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
        }]
      }, {
        model: Vehicle,
        include: [{ model: Car, include: [CarMake, CarModel] }]
      }
    ],
    order: [['updatedAt', 'DESC']],
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
  let dispatchOrder = await DispatchOrder.findByPk(req.body.dispatchOrderId, { include: [{ model: ProductOutward }, { model: Inventory }] })
  if (!dispatchOrder) return res.json({
    success: false,
    message: 'No dispatch order found'
  });
  let availableOrderQuantity = dispatchOrder.quantity - dispatchOrder.ProductOutwards.reduce((acc, outward) => acc += outward.quantity, 0);
  if (req.body.quantity > availableOrderQuantity) return res.json({
    success: false,
    message: 'Cannot dispatch above ordered quantity'
  })
  if (req.body.quantity > dispatchOrder.Inventory.committedQuantity) return res.json({
    success: false,
    message: 'Cannot dispatch above available inventory quantity'
  })
  let productOutward;
  try {
    productOutward = await ProductOutward.create({
      userId: req.userId,
      ...req.body
    });
    const numberOfInternalIdForBusiness = digitize(productOutward.id, 6);
    productOutward.internalIdForBusiness = req.body.internalIdForBusiness + numberOfInternalIdForBusiness;
    productOutward.save();
    dispatchOrder.Inventory.dispatchedQuantity += (+req.body.quantity);
    dispatchOrder.Inventory.committedQuantity -= (+req.body.quantity);
    dispatchOrder.Inventory.save();
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
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
  try {
    const response = await productOutward.save();
    return res.json({
      success: true,
      message: 'Product Outward updated',
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
    include: [{
      model: Inventory,
      include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
    }, {
      model: ProductOutward,
      include: { model: Vehicle }
    }]
  });

  const vehicles = await Vehicle.findAll({ where: { isActive: true } });
  res.json({
    success: true,
    message: 'respond with a resource',
    dispatchOrders, vehicles
  });
});

module.exports = router;
