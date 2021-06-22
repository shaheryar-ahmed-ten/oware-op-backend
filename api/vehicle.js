const express = require('express');
const router = express.Router();
const { Vehicle, Driver } = require('../models')
const config = require('../config');
const { Op } = require("sequelize");
const VEHICLE_TYPES = require('../enums/vehicleTypes');

/* GET vehicles listing. */
router.get('/', async (req, res, next) => {
    const limit = req.query.rowsPerPage || config.rowsPerPage
    const offset = (req.query.page - 1 || 0) * limit;
    let where = {
        // userId: req.userId
    };
    if (req.query.search) where[Op.or] = ['number'].map(key => ({ [key]: { [Op.like]: '%' + req.query.search + '%' } }));
    const response = await Vehicle.findAndCountAll({
        include: [{ model: Driver }],
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

/* POST create new vehicle. */
router.post('/', async (req, res, next) => {
    let message = 'New vehicle registered';
    let vehicle;
    try {
        vehicle = await Vehicle.create({
            registrationNumber: req.body.registrationNumber.toUpperCase(),
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
        data: vehicle
    });
});

/* PUT update existing vehicle. */
router.put('/:id', async (req, res, next) => {
    let vehicle = await Vehicle.findOne({ where: { id: req.params.id } });
    if (!vehicle) return res.status(400).json({
        success: false,
        message: 'No vehicle found!'
    });
    vehicle.registrationNumber = req.body.registrationNumber;
    vehicle.companyId = req.body.companyId;
    vehicle.driverId = req.body.driverId;
    vehicle.make = req.body.make;
    vehicle.model = req.body.model;
    vehicle.year = req.body.year;

    try {
        const response = await Vehicle.save();
        return res.json({
            success: true,
            message: 'vehicle updated',
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
    let response = await Vehicle.destroy({ where: { id: req.params.id } });
    if (response) res.json({
        success: true,
        message: 'vehicle deleted'
    });
    else res.status(400).json({
        success: false,
        message: 'No vehicle found!'
    });
})

router.get('/relations', async (req, res, next) => {
    let where = { isActive: true };
    const driver = await Driver.findAll({
        include: [{ model: Vehicle }],
        where
    });
    const vehicleTypes = VEHICLE_TYPES;
    res.json({
        success: true,
        message: 'respond with a resource',
        driver, vehicleTypes    
    });
});

module.exports = router;
