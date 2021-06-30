const express = require('express');
const router = express.Router();
const { Company, Driver } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");
const { RELATION_TYPES } = require('../enums');

/* GET drivers listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['name', '$Company.name$'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await Driver.findAndCountAll({
    include: [{ model: Company, as: 'Vendor' }],
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

/* POST create new driver. */
router.post('/', async (req, res, next) => {
  let message = 'New driver registered';
  let driver;
  try {
    driver = await Driver.create({
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
    data: driver
  });
});

/* PUT update existing driver. */
router.put('/:id', async (req, res, next) => {
  let driver = await Driver.findOne({ where: { id: req.params.id } });
  if (!driver) return res.status(400).json({
    success: false,
    message: 'No driver found!'
  });
  driver.name = req.body.name;
  driver.companyId = req.body.companyId;
  driver.phone = req.body.phone;
  driver.cnicNumber = req.body.cnicNumber;
  driver.cnicId = req.body.cnicNumberId;
  driver.drivingLicenseNumber = req.body.drivingLicenseNumber;
  driver.drivingLicenseId = req.body.drivingLicenseId;
  try {
    const response = await driver.save();
    return res.json({
      success: true,
      message: 'driver updated',
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
  let response = await Driver.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'driver deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No driver found!'
  });
})

router.get('/relations', async (req, res, next) => {
  let where = { relationType: RELATION_TYPES.VENDOR };
  const companies = await Company.findAll({
    where
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    companies
  });
});

module.exports = router;
