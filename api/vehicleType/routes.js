const router = require("express").Router();
const controller = require("./controller");
const httpStatus = require("http-status");
const config = require("../../config");
const { VehicleType } = require('../../models')
const { Op } = require("sequelize");
const moment = require("moment");

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
    res.sendJson(response.data, response.message, response.success, response.pages)
})

module.exports = router;
