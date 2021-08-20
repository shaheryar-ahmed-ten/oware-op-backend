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
  ProductOutward
} = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const authService = require("../services/auth.service");
const ExcelJS = require("exceljs");
const moment = require("moment");

/* GET inventory listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (!authService.isSuperAdmin(req)) where["$Company.contactId$"] = req.userId;
  if (req.query.search)
    where[Op.or] = ["$Product.name$", "$Company.name$", "$Warehouse.name$"].map(key => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" }
    }));

  const response = await Inventory.findAndCountAll({
    include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
    order: [["updatedAt", "DESC"]],
    where,
    limit,
    offset
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit)
  });
});

/* GET inventory export. */
router.get("/export", async (req, res, next) => {
  let where = {};
  if (!authService.isSuperAdmin(req)) where["$Company.contactId$"] = req.userId;

  let workbook = new ExcelJS.Workbook();

  let worksheet = workbook.addWorksheet("Inventory");

  const getColumnsConfig = columns =>
    columns.map(column => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  worksheet.columns = getColumnsConfig([
    "PRODUCT NAME",
    "CUSTOMER",
    "WAREHOUSE",
    "UOM",
    "AVAILABLE QUANTITY",
    "COMMITTED QUANTITY",
    "DISPATCHED QUANTITY"
  ]);

  let response = await Inventory.findAll({
    include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
    order: [["updatedAt", "DESC"]],
    where
  });

  worksheet.addRows(
    response.map(row => [
      row.Product.name,
      row.Company.name,
      row.Warehouse.name,
      row.Product.UOM.name,
      row.availableQuantity,
      row.committedQuantity,
      row.dispatchedQuantity
    ])
  );

  worksheet = workbook.addWorksheet("Products");

  worksheet.columns = getColumnsConfig([
    "NAME",
    "DESCRIPTION",
    "DIMENSIONS CBM",
    "WEIGHT",
    "UOM",
    "CATEGORY",
    "STATUS"
  ]);

  where = {};
  response = await Product.findAll({
    include: [{ model: UOM }, { model: Category }, { model: Brand }],
    order: [["updatedAt", "DESC"]],
    where
  });

  worksheet.addRows(
    response.map(row => [
      row.name,
      row.description,
      row.dimensionsCBM,
      row.weight,
      row.Category.name,
      row.UOM.name,
      row.isActive ? "Active" : "In-Active"
    ])
  );

  worksheet = workbook.addWorksheet("Companies");

  worksheet.columns = getColumnsConfig([
    "COMPANY NAME",
    "CUSTOMER TYPE",
    "CONTACT NAME",
    "CONTACT EMAIL",
    "CONTACT PHONE",
    "NOTES",
    "STATUS"
  ]);

  if (!authService.isSuperAdmin(req)) where.contactId = req.userId;
  response = await Company.findAll({
    include: [{ model: User, as: "Contact" }],
    order: [["updatedAt", "DESC"]],
    where
  });

  worksheet.addRows(
    response.map(row => [
      row.name,
      row.type,
      row.Contact.firstName + " " + row.Contact.lastName,
      row.Contact.email,
      row.Contact.phone,
      row.notes,
      row.isActive ? "Active" : "In-Active"
    ])
  );

  worksheet = workbook.addWorksheet("Warehouses");

  worksheet.columns = getColumnsConfig(["NAME", "BUSINESS WAREHOUSE CODE", "ADDRESS", "CITY", "STATUS"]);

  where = {};
  response = await Warehouse.findAll({
    order: [["updatedAt", "DESC"]],
    where
  });

  worksheet.addRows(
    response.map(row => [
      row.name,
      row.businessWarehouseCode,
      row.address,
      row.city,
      row.isActive ? "Active" : "In-Active"
    ])
  );

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  worksheet = workbook.addWorksheet("Product Inwards");

  worksheet.columns = getColumnsConfig(["CUSTOMER", "PRODUCT", "WAREHOUSE", "UOM", "QUANTITY", "DATE"]);
  response = await ProductInward.findAll({
    include: [
      { model: User },
      { model: Product, as: "Products", include: [{ model: UOM }] },
      { model: Company },
      { model: Warehouse }
    ],
    order: [["updatedAt", "DESC"]],
    where
  });

  worksheet.addRows(
    response.map(row => [
      row.Company.name,
      row.Products.name,
      row.Warehouse.name,
      //row.Product.UOM.name,
      row.quantity,
      moment(row.createdAt).format("DD/MM/yy HH:mm")
    ])
  );

  worksheet = workbook.addWorksheet("Dispatch Orders");

  worksheet.columns = getColumnsConfig([
    "CUSTOMER",
    "PRODUCT",
    "WAREHOUSE",
    "UOM",
    "RECEIVER NAME",
    "RECEIVER PHONE",
    "REQUESTED QUANTITY",
    "FULFILMENT DATE"
  ]);

  response = await DispatchOrder.findAll({
    include: [
      {
        model: Inventory,
        as: "Inventory",
        include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
      },
      {
        model: Inventory,
        as: "Inventories",
        include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
      }
    ],
    order: [["updatedAt", "DESC"]],
    where
  });

  worksheet.addRows(
    response.map(row => [
      row.Inventory.Company.name,
      row.Inventory.Product.name,
      row.Inventory.Warehouse.name,
      row.Inventory.Product.UOM.name,
      row.receiverName,
      row.receiverPhone,
      row.quantity,
      moment(row.shipmentDate).format("DD/MM/yy HH:mm")
    ])
  );

  worksheet = workbook.addWorksheet("Product Outwards");

  worksheet.columns = getColumnsConfig([
    "CUSTOMER",
    "PRODUCT",
    "WAREHOUSE",
    "UOM",
    "RECEIVER NAME",
    "RECEIVER PHONE",
    "Requested Quantity to Dispatch",
    "Actual Quantity Dispatched",
    "EXPECTED SHIPMENT DATE",
    "ACTUAL DISPATCH DATE"
  ]);

  response = await ProductOutward.findAll({
    include: [
      {
        model: DispatchOrder,
        include: [
          {
            model: Inventory,
            as: "Inventory",
            include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
          },
          {
            model: Inventory,
            as: "Inventories",
            include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
          }
        ]
      }
    ],
    order: [["updatedAt", "DESC"]],
    where
  });

  worksheet.addRows(
    response.map(row => [
      row.DispatchOrder.Inventory.Company.name,
      row.DispatchOrder.Inventory.Product.name,
      row.DispatchOrder.Inventory.Warehouse.name,
      row.DispatchOrder.Inventory.Product.UOM.name,
      row.DispatchOrder.receiverName,
      row.DispatchOrder.receiverPhone,
      row.DispatchOrder.quantity,
      row.quantity,
      moment(row.DispatchOrder.shipmentDate).format("DD/MM/yy HH:mm"),
      moment(row.createdAt).format("DD/MM/yy HH:mm")
    ])
  );

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});

module.exports = router;
