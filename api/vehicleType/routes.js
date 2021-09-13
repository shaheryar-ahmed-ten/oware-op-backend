const router = require("express").Router();
const controller = require("./controller");
const httpStatus = require("http-status");
const config = require("../../config");
const { VehicleType, CarMake, CarModel } = require('../../models')
const { Op } = require("sequelize");
const moment = require("moment");

// Vehicle type listing
router.get('/', async (req, res) => {
    const limit = req.query.rowsPerPage || config.rowsPerPage
    const offset = (req.query.page - 1 || 0) * limit;
    let where = {};
    if (req.query.search)
        where[Op.or] = ["$CarMake.name$", "$CarModel.name$", "$VehicleType.name$"].map(key => ({
            [key]: { [Op.like]: "%" + req.query.search + "%" }
        }));
    const params = {
        limit,
        offset,
        include: [
            {
                model: CarMake,
                as: 'CarMake',
                required: true,
            },
            {
                model: CarModel,
                as: 'CarModel',
                required: true,
            },
            {
                model: VehicleType,
                as: 'VehicleType',
                required: true,
            }
        ],
        where,
        sort: [['updatedAt', 'DESC']],
    }
    const response = await controller.getVehicleTypes(params)
    if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success, response.pages)
    else res.sendError(response.status, response.message, response.error);

})

// single vehicle type
router.get("/:id", async (req, res) => {
    let where = { id: req.params.id };
    const params = {
        where,
        include: [
            {
                model: CarMake,
                as: 'CarMake',
                required: true,
            },
            {
                model: CarModel,
                as: 'CarModel',
                required: true,
            },
            {
                model: VehicleType,
                as: 'VehicleType',
                required: true,
            }
        ]
    }
    const response = await controller.getVehicleTypeById(params)
    if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
    else res.sendError(response.status, response.message, response.error);
})

router.post("/", async (req, res) => {
    const response = await controller.addVehicleType(req.body, req.userId);
    if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
    else res.sendError(response.status, response.message, response.code);
})

router.delete("/:id", async (req, res) => {
    const response = await controller.deleteVehicleType(req.params.id);
    if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
    else res.sendError(response.status, response.message, response.code);
})

router.put("/:id", async (req, res) => {
    const response = await controller.updateVehicleType(req.body, req.params.id);
    if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
    else res.sendError(response.status, response.message, response.code);
})

module.exports = router;
