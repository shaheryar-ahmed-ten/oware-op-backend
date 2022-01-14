const express = require("express");
const router = express.Router();
const {
  Inventory,
  Company,
  Warehouse,
  Product,
  UOM,
  Category,
  Brand,
  User,
  ProductInward,
  DispatchOrder,
  ProductOutward,
  OutwardGroup,
  InventoryDetail,
} = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const authService = require("../services/auth.service");
const ExcelJS = require("exceljs");
const moment = require("moment-timezone");
const activityLog = require("../middlewares/activityLog");
const dao = require("../dao");
const OrderGroup = require("../dao/OrderGroup");
const { digitize } = require("../services/common.services");

/* GET inventory listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (!authService.isSuperAdmin(req)) where["$Company.contactId$"] = req.userId;
  if (req.query.search)
    where[Op.or] = ["$Product.name$", "$Company.name$", "$Warehouse.name$"].map(
      (key) => ({
        [key]: { [Op.like]: "%" + req.query.search + "%" },
      })
    );
  // if (req.query.days) {
  //   const currentDate = moment();
  //   const previousDate = moment().subtract(req.query.days, "days");
  //   where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  // }
  // else if (req.query.startDate && req.query.endDate) {
  //   const startDate = moment(req.query.startDate);
  //   const endDate = moment(req.query.endDate).set({
  //     hour: 23,
  //     minute: 53,
  //     second: 59,
  //     millisecond: 0
  //   });
  //   where["createdAt"] = { [Op.between]: [startDate, endDate] };
  // }

  const response = await Inventory.findAndCountAll({
    include: [
      { model: Product, include: [{ model: UOM }] },
      { model: Company },
      { model: Warehouse },
      { model: InventoryDetail, as: "InventoryDetail" },
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

/* GET inventory export. */
router.get("/export", async (req, res, next) => {
  let where = {};
  if (!authService.isSuperAdmin(req)) where["$Company.contactId$"] = req.userId;

  let workbook = new ExcelJS.Workbook();

  let worksheet = workbook.addWorksheet("Inventory");
  const getColumnsConfig = (columns) =>
    columns.map((column) => ({
      header: column,
      width: Math.ceil(column.length * 1.5),
      outlineLevel: 1,
    }));

  worksheet.columns = getColumnsConfig([
    "PRODUCT NAME",
    "CUSTOMER",
    "WAREHOUSE",
    "UOM",
    "AVAILABLE QUANTITY",
    "COMMITTED QUANTITY",
    "DISPATCHED QUANTITY",
    "BATCH ENABLED",
  ]);

  if (req.query.search)
    where[Op.or] = ["$Product.name$", "$Company.name$", "$Warehouse.name$"].map(
      (key) => ({
        [key]: { [Op.like]: "%" + req.query.search + "%" },
      })
    );

  const response = await Inventory.findAll({
    include: [
      { model: Product, include: [{ model: UOM }] },
      { model: Company },
      { model: Warehouse },
      { model: InventoryDetail, as: "InventoryDetail" },
    ],
    order: [["updatedAt", "DESC"]],
    where,
  });

  worksheet.addRows(
    response.map((row) => [
      row.Product.name,
      row.Company.name,
      row.Warehouse.name,
      row.Product.UOM.name,
      row.availableQuantity,
      row.committedQuantity,
      row.dispatchedQuantity,
      row.Product.batchEnabled,
    ])
  );

  worksheet = workbook.addWorksheet("Batch Details");

  worksheet.columns = getColumnsConfig([
    "PRODUCT NAME",
    "QUANTITY",
    "BATCH NUMBER",
    // "BATCH NAME",
    "MANUFACTURING DATE",
    "EXPIRY DATE",
  ]);
  response.map((row) => {
    row.Product.batchEnabled
      ? worksheet.addRows(
        row.InventoryDetail.map((invDetail) => [
          row.Product.name,
          invDetail.inwardQuantity,
          invDetail.batchNumber,
          // invDetail.batchName,
          moment(invDetail.manufacturingDate).tz(req.query.client_Tz).format("DD/MM/yy"),
          moment(invDetail.expiryDate).tz(req.query.client_Tz).format("DD/MM/yy"),
        ])
      )
      : "";
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + "Inventory.xlsx"
  );

  await workbook.xlsx.write(res).then(() => res.end());
});

/* GET inventory by id. */
router.get("/:id", async (req, res, next) => {
  const response = await Inventory.findOne({
    include: [
      {
        model: Product,
        include: [{ model: UOM }],
      },
      { model: Company },
      { model: Warehouse },
      { model: InventoryDetail, as: "InventoryDetail" },
    ],
    order: [["updatedAt", "DESC"]],
    where: { id: req.params.id },
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response,
  });
});

module.exports = router;