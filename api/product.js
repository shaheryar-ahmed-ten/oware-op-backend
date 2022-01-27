const express = require("express");
const router = express.Router();
const {
  Product,
  User,
  Brand,
  UOM,
  Category,
  sequelize,
  Inventory,
  InventoryDetail,
} = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const httpStatus = require("http-status");
const { BULK_PRODUCT_LIMIT, SPECIAL_CHARACTERS } = require("../enums");
const { addActivityLog } = require("../services/common.services");
const ActivityLog = require("../dao/ActivityLog");
const ExcelJS = require("exceljs");
const moment = require("moment-timezone");
const { digitize } = require("../services/common.services");
const ProductInward = require("../dao/ProductInward");

/* GET products listing. */
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
  if (req.query.search)
    where[Op.or] = ["name"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
  const response = await Product.findAndCountAll({
    include: [
      { model: User },
      { model: UOM },
      { model: Category },
      { model: Brand },
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

/* POST create new product. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New product registered";
  let product;
  if (SPECIAL_CHARACTERS.test(req.body.name))
    return res.json({
      success: false,
      message: "Product name can not contain special characters.",
    });

  try {
    product = await Product.create({
      userId: req.userId,
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
    data: product,
  });
});

router.post("/bulk", activityLog, async (req, res, next) => {
  const totalProducts = req.body.products.length;
  let message = `${totalProducts} products uploaded successfully.`;
  let products;
  try {
    const validationErrors = [];
    const allowedValues = [
      "Name",
      "Description",
      "Volume in cm3",
      "Weight in Kgs",
      "Category",
      "Brand",
      "Uom",
      "BatchEnabled",
      "IsActive",
    ];
    if (totalProducts > BULK_PRODUCT_LIMIT)
      validationErrors.push(`Cannot add product above ${BULK_PRODUCT_LIMIT}`);
    else if (totalProducts === 0)
      return res.sendError(
        httpStatus.CONFLICT,
        "Cannot add empty sheet",
        `Failed to add Bulk Products`
      );
    let row = 2;
    for (const product of req.body.products) {
      Object.keys(product).forEach((item) => {
        if (!allowedValues.includes(item))
          validationErrors.push(`Field ${item} is invalid`);
      });
    }
    if (validationErrors.length)
      res.sendError(
        httpStatus.CONFLICT,
        validationErrors,
        `Failed to add Bulk Products`
      );
    for (const product of req.body.products) {
      product["name"] = product["Name"];
      product["description"] = product["Description"];
      product["volume"] = product["Volume in cm3"];
      product["weight"] = product["Weight in Kgs"];
      product["category"] = product["Category"];
      product["brand"] = product["Brand"];
      product["uom"] = product["Uom"];
      product["batchEnabled"] = product["BatchEnabled"];
      product["isActive"] = product["IsActive"];

      if (product["name"].length === 0)
        validationErrors.push(`Row ${row} : product name cannot be empty.`);
      if (product["description"].length === 0)
        validationErrors.push(`Row ${row} : description cannot be empty.`);

      if (SPECIAL_CHARACTERS.test(product["name"]))
        validationErrors.push(
          `Row ${row} : product ${product.name} has invalid characters for column Name`
        );
      const productAlreadyExist = await Dao.Product.findOne({
        where: { name: product.name },
      });
      if (productAlreadyExist)
        validationErrors.push(
          `Row ${row} : product already exist with name ${productAlreadyExist.name}.`
        );

      if (
        product["batchEnabled"] !== "TRUE" &&
        product["batchEnabled"] !== "FALSE"
      )
        validationErrors.push(
          `Row ${row} : ${product.name} has invalid value for column batchEnabled ${product.batchEnabled}`
        );

      if (product["isActive"] !== "TRUE" && product["isActive"] !== "FALSE")
        validationErrors.push(
          `Row ${row} : ${product.name} has invalid value for column isActive ${product.isActive}`
        );

      product["userId"] = req.userId;
      product["batchEnabled"] = product["batchEnabled"] === "TRUE" ? 1 : 0;
      product["isActive"] = product["isActive"] === "TRUE" ? 1 : 0;
      product["dimensionsCBM"] = product["volume"];
      const category = await Dao.Category.findOne({
        where: {
          where: sequelize.where(
            sequelize.fn("BINARY", sequelize.col("name")),
            product.category
          ),
          isActive: 1,
        },
      });
      if (!category)
        validationErrors.push(
          `Row ${row} : category doesn't exist with name ${product.category} for product ${product.name}.`
        );
      const brand = await Dao.Brand.findOne({
        where: {
          where: sequelize.where(
            sequelize.fn("BINARY", sequelize.col("name")),
            product.brand
          ),
          isActive: 1,
        },
      });
      if (!brand)
        validationErrors.push(
          `Row ${row} : brand doesn't exist with name ${product.brand} for product ${product.name}.`
        );
      const uom = await Dao.UOM.findOne({
        where: {
          where: sequelize.where(
            sequelize.fn("BINARY", sequelize.col("name")),
            product.uom
          ),
          isActive: 1,
        },
      });
      if (!uom)
        validationErrors.push(
          `Row ${row} : uom doesn't exist with name ${product.uom} for product ${product.name}.`
        );

      if (category && brand && uom) {
        product["categoryId"] = category.id;
        product["brandId"] = brand.id;
        product["uomId"] = uom.id;
      }

      row++;
    }

    if (validationErrors.length)
      return res.sendError(
        httpStatus.CONFLICT,
        validationErrors,
        "Failed to add bulk Products"
      );
    products = await Product.bulkCreate(req.body.products);
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
  res.json({
    success: true,
    message,
    data: products,
  });
});

/* Get bulk upload template. */
router.get("/bulk-template", async (req, res, next) => {
  let workbook = new ExcelJS.Workbook();

  let worksheet = workbook.addWorksheet("Products");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({
      header: column,
      width: Math.ceil(column.length * 1.5),
      outlineLevel: 1,
    }));

  worksheet.columns = getColumnsConfig([
    "Name",
    "Description",
    "Volume in cm3",
    "Weight in Kgs",
    "Category",
    "Brand",
    "Uom",
    "BatchEnabled",
    "IsActive",
  ]);

  worksheet.addRows(
    [
      {
        name: "COKE ZERO",
        description: "product of Coco Cola(sample product)",
        volume: "1.4",
        weight: "2",
        category: "Drinks",
        brand: "CocoCola",
        uom: "Bottles",
        batchEnabled: "FALSE",
        isActive: "TRUE",
      },
      {
        name: "COKE",
        description: "product of Coco Cola(sample product)",
        volume: "4",
        weight: "10",
        category: "liquids",
        brand: "CocoCola",
        uom: "PCs",
        batchEnabled: "TRUE",
        isActive: "FALSE",
      },
    ].map((el, idx) => [
      el.name,
      el.description,
      el.volume,
      el.weight,
      el.category,
      el.brand,
      el.uom,
      el.batchEnabled,
      el.isActive,
    ])
  );

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

/* PUT update existing product. */
router.put("/:id", activityLog, async (req, res, next) => {
  let product = await Product.findOne({ where: { id: req.params.id } });
  if (!product)
    return res.status(400).json({
      success: false,
      message: "No product found!",
    });
  if (req.body.batchEnabled === "") delete req.body.batchEnabled;
  try {
    const inventories = await Inventory.findAll({
      where: { productId: product.id },
      include: ["InventoryDetail"],
    });

    //check if you can change batch toggle for all the inventories,and send error if there is any
    for (const inventory of inventories) {
      if (product.batchEnabled === false && req.body.batchEnabled === true) {
        if (inventory.totalInwardQuantity > 0) {
          return res.sendError(
            httpStatus.CONFLICT,
            "state of toggle cannot be changed when inward exist!"
          );
        }
      } else if (
        product.batchEnabled === true &&
        req.body.batchEnabled === false
      ) {
        if (inventory.totalInwardQuantity > 0) {
          return res.sendError(
            httpStatus.CONFLICT,
            "state of toggle cannot be changed when inward exist!"
          );
        }
      }
    }

    const response = await Product.update(req.body, {
      where: { id: req.params.id },
    });
    await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
    return res.json({
      success: true,
      message: "Product updated",
      data: product,
    });
  } catch (err) {
    console.log("err", err);
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
});

/* PUT toggle batch enable on existing product. */
router.put("/enable/:id", activityLog, async (req, res, next) => {
  let product = await Product.findOne({ where: { id: req.params.id } });
  if (!product)
    return res.status(400).json({
      success: false,
      message: "No product found!",
    });
  try {
    const inventory = await Inventory.findOne({
      where: { productId: product.id },
      include: ["InventoryDetail"],
    });

    if (product.batchEnabled === true && req.body.batchEnabled === false) {
      for (const batch of inventory.InventoryDetail) {
        if (batch.availableQuantity > 0)
          return res.sendError(
            httpStatus.CONFLICT,
            "cannot toggle off for product having available batches"
          );
      }
    }
    if (product.batchEnabled === false && req.body.batchEnabled === true) {
      for (const batch of inventory.InventoryDetail) {
        if (batch.availableQuantity > 0)
          return res.sendError(
            httpStatus.CONFLICT,
            "cannot toggle on for product having available inventory"
          );
      }
    }

    const response = await Product.update(
      { batchEnabled: req.body.batchEnabled },
      { where: { id: req.params.id } }
    );
    await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
    return res.json({
      success: true,
      message: "Product updated",
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
  let response = await Product.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "Product deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No product found!",
    });
});

router.get("/relations", async (req, res, next) => {
  let where = { isActive: true };
  const brands = await Brand.findAll({ where });
  const uoms = await UOM.findAll({ where });
  const categories = await Category.findAll({ where });
  res.json({
    success: true,
    message: "respond with a resource",
    brands,
    uoms,
    categories,
  });
});

router.get("/export", activityLog, async (req, res, next) => {
  let workbook = new ExcelJS.Workbook();

  worksheet = workbook.addWorksheet("Products");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({
      header: column,
      width: Math.ceil(column.length * 1.5),
      outlineLevel: 1,
    }));

  worksheet.columns = getColumnsConfig([
    "PRODUCT ID",
    "NAME",
    "DESCRIPTION",
    "DIMENSIONS CBM",
    "WEIGHT",
    "CATEGORY",
    "UOM",
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
  if (req.query.search)
    where[Op.or] = ["name"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));

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

module.exports = router;
