const express = require('express');
const router = express.Router();
const { UOM } = require('../models')
const { Op } = require("sequelize");

/* GET uoms listing. */
router.get('/', async (req, res, next) => {
  const limit = req.body.rowsPerPage || config.rowsPerPage
  const offset = (req.body.page || 0) * limit;
  let where = {};
  if (req.body.search) where.name = { [Op.like]: '%' + req.body.search + '%' };
  const uoms = await UOM.findAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }],
    orderBy: [['createdAt', 'DESC']],
    limit, offset, where, raw: true
  });
  res.json({
    success: true,
    message: 'respond with a resource',
    data: uoms
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
    message = err.errors.pop().message;
  }
  res.json({
    success: true,
    message,
    data: uom
  });
});

/* PUT update existing uom. */
router.put('/:id', async (req, res, next) => {
  let uom = await UOM.findOne({ where: { id: req.params.id } });
  if (uom) {
    res.json({
      success: true,
      message: 'UOM updated',
      data: uom
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No uom found!'
    })
  }
});

module.exports = router;
