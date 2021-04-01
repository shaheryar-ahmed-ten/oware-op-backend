const express = require('express');
const router = express.Router();
const { Customer, User } = require('../models')
const { Op } = require("sequelize");
const config = require('../config');

/* GET customers listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['companyName'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await Customer.findAndCountAll({
    include: [{ model: User }, { model: User, as: 'Contact' }],
    orderBy: [['updatedAt', 'DESC']],
    limit, offset, where
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    pages: Math.ceil(response.count / limit)
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
    return res.json({
      success: false,
      message: err.message
    });
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
  if (!customer) return res.status(400).json({
    success: false,
    message: 'No customer found!'
  });
  customer.companyName = req.body.companyName;
  customer.contactId = req.body.contactId;
  customer.notes = req.body.notes;
  customer.isActive = req.body.isActive;
  const response = await customer.save();
  return res.json({
    success: true,
    message: 'Customer updated',
    data: response
  });
});

router.delete('/:id', async (req, res, next) => {
  let response = await Customer.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'Customer deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No customer found!'
  });
})

router.get('/relations', async (req, res, next) => {
  let where = { isActive: true };
  const users = await User.findAll(where);
  res.json({
    success: true,
    message: 'respond with a resource',
    users
  });
});

module.exports = router;
