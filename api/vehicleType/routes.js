const router = require("express").Router();
const controller = require("./controller");
const httpStatus = require("http-status");
const config = require("../../config");
const { VehicleType } = require('../../models')
const { Op } = require("sequelize");
const moment = require("moment");

// Vehicle type listing
router.get('/', async (req, res) => {
    const limit = req.query.rowsPerPage || config.rowsPerPage
    const offset = (req.query.page - 1 || 0) * limit;
    let where = {};
    const params = {
        limit,
        offset,
        where,

        order: [['updatedAt', 'DESC']],
    }
    const response = await controller.getVehicleTypes(params)
    if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success, response.pages)
    else res.sendError(response.status, response.message, response.error);

})

// single vehicle type
router.get("/:id", async (req, res) => {
    let where = { id: req.params.id };
    const params = {
        where
    }
    const response = await controller.getVehicleTypeById(params)
    if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
    else res.sendError(response.status, response.message, response.error);
})

module.exports = router;
