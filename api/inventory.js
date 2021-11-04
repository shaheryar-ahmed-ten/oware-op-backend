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
    where[Op.or] = ["$Product.name$", "$Company.name$", "$Warehouse.name$"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
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
    include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
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
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  worksheet.columns = getColumnsConfig([
    "PRODUCT NAME",
    "CUSTOMER",
    "WAREHOUSE",
    "UOM",
    "AVAILABLE QUANTITY",
    "COMMITTED QUANTITY",
    "DISPATCHED QUANTITY",
  ]);

  // if (req.query.days) {
  //   const currentDate = moment();
  //   const previousDate = moment().subtract(req.query.days, "days");
  //   where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  // }
  // else if (req.query.startingDate && req.query.endingDate) {
  //   const startDate = moment(req.query.startingDate);
  //   const endDate = moment(req.query.endingDate).set({
  //     hour: 23,
  //     minute: 53,
  //     second: 59,
  //     millisecond: 0
  //   });
  //   where["createdAt"] = { [Op.between]: [startDate, endDate] };
  // }

  let response = await Inventory.findAll({
    include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
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
    ])
  );

  worksheet = workbook.addWorksheet("Products");

  worksheet.columns = getColumnsConfig([
    "PRODUCT ID",
    "NAME",
    "DESCRIPTION",
    "DIMENSIONS CBM",
    "WEIGHT",
    "UOM",
    "CATEGORY",
    "STATUS",
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

  response = await Product.findAll({
    include: [{ model: UOM }, { model: Category }, { model: Brand }],
    order: [["updatedAt", "DESC"]],
    where,
  });

  worksheet.addRows(
    response.map((row) => [
      digitize(row.id || 0, 6),
      row.name,
      row.description,
      row.dimensionsCBM,
      row.weight,
      row.Category.name,
      row.UOM.name,
      row.isActive ? "Active" : "In-Active",
    ])
  );

  worksheet = workbook.addWorksheet("Companies");

  worksheet.columns = getColumnsConfig([
    "ID",
    "COMPANY NAME",
    "CUSTOMER TYPE",
    "CONTACT NAME",
    "CONTACT EMAIL",
    "CONTACT PHONE",
    "NOTES",
    "STATUS",
  ]);

  if (!authService.isSuperAdmin(req)) where.contactId = req.userId;
  response = await Company.findAll({
    include: [{ model: User, as: "Contact" }],
    order: [["updatedAt", "DESC"]],
    where,
  });

  worksheet.addRows(
    response.map((row) => [
      row.internalIdForBusiness || "",
      row.name,
      row.type,
      row.Contact.firstName + " " + row.Contact.lastName,
      row.Contact.email,
      row.Contact.phone,
      row.notes,
      row.isActive ? "Active" : "In-Active",
    ])
  );

  worksheet = workbook.addWorksheet("Warehouses");

  worksheet.columns = getColumnsConfig(["NAME", "BUSINESS WAREHOUSE CODE", "ADDRESS", "CITY", "STATUS"]);

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

  response = await Warehouse.findAll({
    order: [["updatedAt", "DESC"]],
    where,
  });

  worksheet.addRows(
    response.map((row) => [
      row.name,
      row.businessWarehouseCode,
      row.address,
      row.city,
      row.isActive ? "Active" : "In-Active",
    ])
  );

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  worksheet = workbook.addWorksheet("Product Inwards");

  worksheet.columns = getColumnsConfig([
    "INWARD ID",
    "CUSTOMER",
    "PRODUCT",
    "WAREHOUSE",
    "UOM",
    "QUANTITY",
    "REFERENCE ID",
    "CREATOR",
    "INWARD DATE",
  ]);

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

  response = await ProductInward.findAll({
    include: [
      { model: User },
      { model: Product, as: "Products", include: [{ model: UOM }] },
      { model: Company },
      { model: Warehouse },
    ],
    order: [["updatedAt", "DESC"]],
    where,
  });

  const inwardArray = [];
  for (const inward of response) {
    for (const Product of inward.Products) {
      inwardArray.push([
        inward.internalIdForBusiness || "",
        inward.Company.name,
        Product.name,
        inward.Warehouse.name,
        Product.UOM.name,
        Product.InwardGroup.quantity,
        inward.referenceId || "",
        `${inward.User.firstName || ""} ${inward.User.lastName || ""}`,
        moment(inward.createdAt).tz(req.query.client_Tz).format("DD/MM/yy HH:mm"),
      ]);
    }
  }

  worksheet.addRows(inwardArray);

  // worksheet.addRows(
  //   response.map((row) => [
  //     row.Company.name,
  //     row.Products.name,
  //     row.Warehouse.name,
  //     row.Product.UOM.name,
  //     row.quantity,
  //     moment(row.createdAt).format("DD/MM/yy HH:mm"),
  //   ])
  // );

  worksheet = workbook.addWorksheet("Dispatch Orders");

  worksheet.columns = getColumnsConfig([
    "DISPATCH ORDER ID",
    "CUSTOMER",
    "PRODUCT",
    "WAREHOUSE",
    "UOM",
    "RECEIVER NAME",
    "RECEIVER PHONE",
    "REQUESTED QUANTITY",
    "REFERENCE ID",
    "CREATOR",
    "CREATED DATE",
    "STATUS",
  ]);

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

  response = await DispatchOrder.findAll({
    include: [
      {
        model: Inventory,
        as: "Inventory",
        include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
      },
      {
        model: Inventory,
        as: "Inventories",
        include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
      },
      { model: User },
    ],
    order: [["updatedAt", "DESC"]],
    where,
  });

  const orderArray = [];
  for (const order of response) {
    for (const inv of order.Inventories) {
      orderArray.push([
        order.internalIdForBusiness || "",
        order.Inventory.Company.name,
        inv.Product.name,
        order.Inventory.Warehouse.name,
        inv.Product.UOM.name,
        order.receiverName,
        order.receiverPhone,
        inv.OrderGroup.quantity,
        order.referenceId || "",
        `${order.User.firstName || ""} ${order.User.lastName || ""}`,
        moment(order.createdAt).tz(req.query.client_Tz).format("DD/MM/yy HH:mm"),
        order.status == "0"
          ? "PENDING"
          : order.status == "1"
          ? "PARTIALLY FULFILLED"
          : order.status == "2"
          ? "FULFILLED"
          : order.status == "3"
          ? "CANCELLED"
          : "",
      ]);
    }
  }

  worksheet.addRows(orderArray);

  // Commenting outwards

  worksheet = workbook.addWorksheet("Product Outwards");

  worksheet.columns = getColumnsConfig([
    "OUTWARD ID",
    "CUSTOMER",
    "PRODUCT",
    "WAREHOUSE",
    "UOM",
    "RECEIVER NAME",
    "RECEIVER PHONE",
    "REFERENCE ID",
    "CREATOR",
    "Requested Quantity to Dispatch",
    "Actual Quantity Dispatched",
    "EXPECTED SHIPMENT DATE",
    "ACTUAL DISPATCH DATE",
  ]);

  response = await ProductOutward.findAll({
    include: [
      {
        model: DispatchOrder,
        include: [
          {
            model: Inventory,
            as: "Inventory",
            include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
          },
          {
            model: Inventory,
            as: "Inventories",
            include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
          },
        ],
      },
      { model: User },
    ],
    order: [["updatedAt", "DESC"]],
    where,
  });

  const outwardArray = [];
  for (const outward of response) {
    for (const inv of outward.DispatchOrder.Inventories) {
      const OG = await OrderGroup.findOne({
        where: { inventoryId: inv.id, orderId: outward.DispatchOrder.id },
      });
      const OutG = await OutwardGroup.findOne({
        where: { inventoryId: inv.id, outwardId: outward.id },
      });

      outwardArray.push([
        outward.internalIdForBusiness || "",
        inv.Company.name,
        inv.Product.name,
        inv.Warehouse.name,
        inv.Product.UOM.name,
        outward.DispatchOrder.receiverName,
        outward.DispatchOrder.receiverPhone,
        outward.referenceId || "",
        `${outward.User.firstName || ""} ${outward.User.lastName || ""}`,
        OG.quantity || 0,
        OutG ? OutG.quantity || 0 : "Not available",
        // OutG.quantity || 0,
        moment(outward.DispatchOrder.shipmentDate).format("DD/MM/yy HH:mm"),
        moment(outward.createdAt).tz(req.query.client_Tz).format("DD/MM/yy HH:mm"),
      ]);
    }
  }

  worksheet.addRows(outwardArray);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});

module.exports = router;
