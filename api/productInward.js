const express = require('express');
const router = express.Router();
const { Inventory, ProductInward, InwardGroup, User, Company, Warehouse, Product, UOM, sequelize } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");
const authService = require('../services/auth.service');
const { digitize } = require('../services/common.services');
const { RELATION_TYPES } = require('../enums');

/* GET productInwards listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['$Product.name$', '$Company.name$', '$Warehouse.name$'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await ProductInward.findAndCountAll({
    distinct: true,
    include: [{
      model: Product, as: 'Product', include: [{ model: UOM }]
    }, {
      model: Product, as: 'Products', include: [{ model: UOM }]
    }, User, Company, Warehouse],
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

/* POST create new productInward. */
router.post('/', async (req, res, next) => {
  let productInward;
  let message = 'New productInward registered';
  // Hack for backward compatibility
  req.body.products = req.body.products || [{ id: req.body.productId, quantity: req.body.quantity }];

  await sequelize.transaction(async transaction => {
    productInward = await ProductInward.create({
      userId: req.userId,
      ...req.body
    }, { transaction });

    const numberOfinternalIdForBusiness = digitize(productInward.id, 6);
    productInward.internalIdForBusiness = req.body.internalIdForBusiness + numberOfinternalIdForBusiness;
    await productInward.save({ transaction });

    await InwardGroup.bulkCreate(req.body.products.map(product => ({
      userId: req.userId,
      inwardId: productInward.id,
      productId: product.id,
      quantity: product.quantity
    })), { transaction });

    return await Promise.all(req.body.products.map(product => Inventory.findOne({
      where: {
        customerId: req.body.customerId,
        warehouseId: req.body.warehouseId,
        productId: product.id
      }
    }).then(inventory => {
      if (!inventory) return Inventory.create({
        customerId: req.body.customerId,
        warehouseId: req.body.warehouseId,
        productId: product.id,
        availableQuantity: product.quantity,
        referenceId: req.body.referenceId,
        totalInwardQuantity: product.quantity
      }, { transaction })
      else {
        inventory.availableQuantity += (+product.quantity);
        inventory.totalInwardQuantity += (+product.quantity);
        return inventory.save({ transaction });
      }
    })))
  });
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

  const warehouses = await Warehouse.findAll({ where });
  const products = await Product.findAll({ where, include: [{ model: UOM }] });

  if (!authService.isSuperAdmin(req)) where.contactId = req.userId;
  const customers = await Company.findAll({
    where: {
      ...where,
      relationType: RELATION_TYPES.CUSTOMER
    }
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    customers, warehouses, products
  });
});

module.exports = router;
