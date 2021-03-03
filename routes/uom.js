const express = require('express');
const router = express.Router();
const { UOM } = require('../models')

/* GET uoms listing. */
router.get('/', async (req, res, next) => {
  const uoms = await UOM.findAll({
    include: [{ model: Role, include: [{ model: PermissionAccess, include: [{ model: Permission }] }] }]
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
