const express = require('express');
const router = express.Router();
const { Customer, User } = require('../models')
const { Op } = require("sequelize");
const config = require('../config');

/* GET customers listing. */
router.get('/', async (req, res, next) => {
  const limit = req.body.rowsPerPage || config.rowsPerPage
  const offset = (req.body.page || 0) * limit;
  let where = {};
  if (req.body.search) where.name = { [Op.like]: '%' + req.body.search + '%' };
  const customers = await Customer.findAll({
    include: [{ model: User }],
    orderBy: [['createdAt', 'DESC']],
    limit, offset, where, raw: true
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: customers
  });
});

/* POST create new customer. */
router.post('/', async (req, res, next) => {
  let message = 'New customer registered';
  let customer;
  try {
    customer = await Customer.create({
      userId: req.userId,
      ...req.body
    });
  } catch (err) {
    message = err.errors.pop().message;
  }
  res.json({
    success: true,
    message,
    data: customer
  });
});

/* PUT update existing customer. */
router.put('/:id', async (req, res, next) => {
  let customer = await Customer.findOne({ where: { id: req.params.id } });
  if (customer) {
    res.json({
      success: true,
      message: 'Customer updated',
      data: customer
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No customer found!'
    })
  }
});

module.exports = router;
