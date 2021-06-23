const express = require('express');
const router = express.Router();
const { Ride, User, Vehicle, Driver, Company } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");
const { RIDE_STATUS } = require('../enums/rideStatus');

/* GET rides listing. */
router.get('/', async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search) where[Op.or] = ['pickupArea', 'dropoffArea', '$Vehicle.Car.CarModel.name$', '$Vehicle.Car.CarModel.name$']
    .map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
  const response = await Ride.findAndCountAll({
    include: [{ model: User }, { model: Vehicle, include: [Company] }, Driver],
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

/* POST create new ride. */
router.post('/', async (req, res, next) => {
  let message = 'New ride registered';
  let ride;
  try {
    ride = await Ride.create({
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
    data: ride
  });
});

/* PUT update existing ride. */
router.put('/:id', async (req, res, next) => {
  let ride = await Ride.findOne({ where: { id: req.params.id } });
  if (!ride) return res.status(400).json({
    success: false,
    message: 'No ride found!'
  });
  ride.vehicleId = req.body.vehicleId;
  ride.driverId = req.body.driverId;
  ride.pickupDate = req.body.pickupDate;
  ride.dropoffDate = req.body.dropoffDate;
  ride.pickupArea = req.body.pickupArea;
  ride.dropoffArea = req.body.dropoffArea;
  ride.status = req.body.status;
  try {
    const response = await ride.save();
    return res.json({
      success: true,
      message: 'Ride updated',
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
  let response = await Ride.destroy({ where: { id: req.params.id } });
  if (response) res.json({
    success: true,
    message: 'Ride deleted'
  });
  else res.status(400).json({
    success: false,
    message: 'No ride found!'
  });
})

router.get('/relations', async (req, res, next) => {
  let where = { isActive: true };
  const vehicles = await Vehicle.findAll({ where });
  const drivers = await Driver.findAll({ where });
  const statuses = RIDE_STATUS;
  res.json({
    success: true,
    message: 'respond with a resource',
    vehicles, drivers, categories, statuses
  });
});

module.exports = router;
