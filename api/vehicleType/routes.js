const router = require("express").Router();
const controller = require("./controller");
const httpStatus = require("http-status");
const config = require("../../config");
const { VehicleType, CarMake, CarModel } = require("../../models");
const { Op } = require("sequelize");
const moment = require("moment");
const activityLog = require("../../middlewares/activityLog");

// Vehicle type listing
router.get("/", async (req, res) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search)
    where[Op.or] = ["$CarMake.name$", "$CarModel.name$", "$VehicleType.name$"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
  const params = {
    limit,
    offset,
    include: [
      {
        model: CarMake,
        as: "CarMake",
        required: true,
      },
      {
        model: CarModel,
        as: "CarModel",
        required: true,
      },
      {
        model: VehicleType,
        as: "VehicleType",
        required: true,
      },
    ],
    where,
    sort: [["updatedAt", "DESC"]],
  };
  const response = await controller.getVehicleTypes(params);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.pages);
  else res.sendError(response.status, response.message, response.error);
});

// Vehicle type relations
router.get("/relations", async (req, res) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  let where = {};
  const params = {
    include: [],
    where,
    sort: [["updatedAt", "DESC"]],
  };
  const response = await controller.getCarRelations(params);
  if (response.status === httpStatus.OK)
    res.sendJson(response.data, response.message, response.success, response.pages);
  else res.sendError(response.status, response.message, response.error);
});

// single vehicle type
router.get("/:id", async (req, res) => {
  let where = { id: req.params.id };
  const params = {
    where,
    include: [
      {
        model: CarMake,
        as: "CarMake",
        required: true,
      },
      {
        model: CarModel,
        as: "CarModel",
        required: true,
      },
      {
        model: VehicleType,
        as: "VehicleType",
        required: true,
      },
    ],
  };
  const response = await controller.getVehicleTypeById(params);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.error);
});

router.post("/", activityLog, async (req, res) => {
  const response = await controller.addVehicleType(req.body, req.userId, req["activityLogId"]);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.code);
});

router.delete("/:id", activityLog, async (req, res) => {
  const response = await controller.deleteVehicleType(req.params.id);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.code);
});

router.put("/:id", activityLog, async (req, res) => {
  const response = await controller.updateVehicleType(req.body, req.params.id, req["activityLogId"]);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.code);
});

module.exports = router;
