const express = require('express');
const router = express.Router();
const { UOM, User } = require('../models')
const { Op } = require("sequelize");
const config = require('../config');


/* GET uoms listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ['name'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await UOM.findAndCountAll({
    include: [{ model: User }],
    order: [['updatedAt', 'DESC']],
    limit, offset, where
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: response.rows,
    pages: Math.ceil(response.count / limit)
  });
});

/* POST create new uom. */
router.post('/', async (req, res, next) => {
  let message = 'New uom registered';
  let uom;
  try {
    uom = await UOM.create({
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
    data: uom
  });
});

/* PUT update existing category. */
router.put('/:id', async (req, res, next) => {
  let uom = await UOM.findOne({ where: { id: req.params.id } });
  if (!uom) return res.status(400).json({
    success: false,
    message: 'No uom found!'
  });
  uom.name = req.body.name;
  uom.isActive = req.body.isActive;
  try {
    const response = await uom.save();
    return res.json({
      success: true,
      message: 'UOM updated',
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
  let response = await UOM.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'UOM deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No uom found!'
  });
})


module.exports = router;
