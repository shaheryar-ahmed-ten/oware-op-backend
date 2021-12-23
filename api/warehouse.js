const express = require("express");
const router = express.Router();
const { Warehouse, User } = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const { errorHandler } = require("../services/error.service");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const { addActivityLog } = require("../services/common.services");
const { reverseGeocoding } = require("../services/map.service");
const moment = require("moment-timezone");
const ExcelJS = require("exceljs");

/* GET warehouses listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.startingDate && req.query.endingDate) {
    const startDate = moment(req.query.startingDate);
    const endDate = moment(req.query.endingDate).set({
      hour: 23,
      minute: 53,
      second: 59,
      millisecond: 0,
    });
    where["createdAt"] = { [Op.between]: [startDate, endDate] };
  }
  if (req.query.search) where[Op.or] = ["name"].map((key) => ({ [key]: { [Op.like]: "%" + req.query.search + "%" } }));
  const response = await Warehouse.findAndCountAll({
    include: [{ model: User }, { model: User, as: "Manager" }],
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

router.get("/relations", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
    isActive: 1
  };
  const response = await Warehouse.findAndCountAll({
    include: [{ model: User }],
    order: [["updatedAt", "DESC"]],
    where,  
    // limit,
    offset,
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    // pages: Math.ceil(response.count / limit),
  });
});
/* POST create new warehouse. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New warehouse registered";
  let warehouse;
  try {
    warehouse = await Warehouse.create({
      userId: req.userId,
      ...req.body,
    });
    warehouse.save();
  } catch (err) {
    console.log("err", err);
    errorHandler(err);
    return res.json({
      success: false,
      message: err.message,
    });
  }
  res.json({
    success: true,
    message,
    data: warehouse,
  });
});

/* PUT update existing warehouse. */
router.put("/:id", activityLog, async (req, res, next) => {
  let warehouse = await Warehouse.findOne({ where: { id: req.params.id } });
  if (!warehouse)
    return res.status(400).json({
      success: false,
      message: "No warehouse found!",
    });
  try {
    const response = await Warehouse.update(req.body, { where: { id: req.params.id } });
    await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
    return res.json({
      success: true,
      message: "Warehouse updated",
      data: response,
    });
  } catch (err) {
    console.log("err", err);
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
});

router.delete("/:id", activityLog, async (req, res, next) => {
  let response = await Warehouse.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "Warehouse deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No warehouse found!",
    });
});

router.get("/export", activityLog, async (req, res, next) => {
  let workbook = new ExcelJS.Workbook();

  worksheet = workbook.addWorksheet("Warehouses");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  worksheet.columns = getColumnsConfig([
    "WAREHOUSE NAME",
    "BUSINESS WAREHOUSE CODE",
    "ADDRESS",
    "CITY",
    "STATUS",
    "MANAGER",
    "CAPACITY",
    "MAP ADDRESS",
    "MEMO",
  ]);

  where = {};

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.startingDate && req.query.endingDate) {
    const startDate = moment(req.query.startingDate);
    const endDate = moment(req.query.endingDate).set({
      hour: 23,
      minute: 53,
      second: 59,
      millisecond: 0,
    });
    where["createdAt"] = { [Op.between]: [startDate, endDate] };
  }
  if (req.query.search) where[Op.or] = ["name"].map((key) => ({ [key]: { [Op.like]: "%" + req.query.search + "%" } }));

  response = await Warehouse.findAll({
    include: [{ model: User, as: "Manager" }],
    order: [["updatedAt", "DESC"]],
    where,
  });

  for (const row of response) {
    if (row.locationLatlng) {
      row.mapAddress = (await reverseGeocoding(row.locationLatlng)).formattedAddress || "";
    } else {
      row.mapAddress = "";
    }
  }

  worksheet.addRows(
    response.map((row) => [
      row.name,
      row.businessWarehouseCode,
      row.address,
      row.city,
      row.isActive ? "Active" : "In-Active",
      row.Manager ? row.Manager.username : "",
      row.capacity > 0 ? row.capacity : "",
      row.locationLatlng ? row.mapAddress : "",
      row.memo,
    ])
  );

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});

module.exports = router;
