const express = require("express");
const router = express.Router();
const { Vehicle, Driver, Car, CarMake, CarModel, Company, File, VehicleType } = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const VEHICLE_TYPES = require("../enums/vehicleTypes");
const { RELATION_TYPES } = require("../enums");
const activityLog = require("../middlewares/activityLog");

/* GET vehicles listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search)
    where[Op.or] = ["registrationNumber", "$Vendor.name$", "$Car.CarMake.name$", "$Car.CarModel.name$"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
  const response = await Vehicle.findAndCountAll({
    include: [
      Driver,
      { model: File, as: "RoutePermit" },
      { model: File, as: "RunningPaper" },
      { model: Car, include: [CarMake, CarModel] },
      { model: Company, as: "Vendor" },
    ],
    order: [["updatedAt", "DESC"]],
    where,
    limit,
    offset,
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
  });
});

/* POST create new vehicle. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New vehicle registered";
  let vehicle;
  try {
    vehicle = await Vehicle.create({
      userId: req.userId,
      registrationNumber: req.body.registrationNumber.toUpperCase(),
      ...req.body,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
  res.json({
    success: true,
    message,
    data: vehicle,
  });
});

/* PUT update existing vehicle. */
router.put("/:id", activityLog, async (req, res, next) => {
  let vehicle = await Vehicle.findOne({ where: { id: req.params.id } });
  if (!vehicle)
    return res.status(400).json({
      success: false,
      message: "No vehicle found!",
    });
  vehicle.registrationNumber = req.body.registrationNumber;
  vehicle.companyId = req.body.companyId;
  vehicle.driverId = req.body.driverId;
  vehicle.routePermitId = req.body.routePermitId;
  vehicle.runningPaperId = req.body.runningPaperId;
  vehicle.carId = req.body.carId;

  try {
    const response = await vehicle.save();
    return res.json({
      success: true,
      message: "vehicle updated",
      data: response,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
});

router.delete("/:id", activityLog, async (req, res, next) => {
  let response = await Vehicle.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "vehicle deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No vehicle found!",
    });
});

router.get("/relations", async (req, res, next) => {
  let where = { isActive: true };
  const drivers = await Driver.findAll({
    where,
    include: [
      { model: Company, as: "Vendor" },
      { model: Vehicle, include: [{ model: Car, include: [CarMake, CarModel] }] },
    ],
  });
  const vendors = await Company.findAll({
    where: { ...where, relationType: RELATION_TYPES.VENDOR },
    include: [{ model: Driver, as: "Drivers" }],
  });
  let cars = await Car.findAll({
    where,
    include: [CarMake, CarModel, {
      model: VehicleType,
      as: 'VehicleType',
      required: true,
    }],
  });

  const vehicleTypes = VEHICLE_TYPES;
  res.json({
    success: true,
    message: "respond with a resource",
    drivers,
    vehicleTypes,
    vendors,
    cars,
  });
});

module.exports = router;
