const express = require("express");
const router = express.Router();
const { Product, User, Brand, UOM, Category } = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const httpStatus = require("http-status");
const { BULK_PRODUCT_LIMIT } = require("../enums");
const { addActivityLog } = require("../services/common.services");

const Joi = require("joi");
const ActivityLog = require("../dao/ActivityLog");

const AddValidation = Joi.object({
  products: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().required(),
      volume: Joi.number().integer().required(),
      weight: Joi.number().integer().required(),
      category: Joi.string().required(),
      brand: Joi.string().required(),
      uom: Joi.string().required(),
      isActive: Joi.string().required(),
    })
  ),
});

/* GET products listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search) where[Op.or] = ["name"].map((key) => ({ [key]: { [Op.like]: "%" + req.query.search + "%" } }));
  const response = await Product.findAndCountAll({
    include: [{ model: User }, { model: UOM }, { model: Category }, { model: Brand }],
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
  // const isValid = await AddValidation.validateAsync(req.body);
  // if (isValid) {
  let message = "Bulk products registered";
  let products;
  try {
    const validationErrors = [];
    const allowedValues = ["Name", "Description", "Volume in cm3", "Weight", "Category", "Brand", "Uom", "IsActive"];
    // req.body.products = req.body.products.map((product) => {
    if (req.body.products.length > BULK_PRODUCT_LIMIT)
      // return res.sendError(httpStatus.CONFLICT, `Cannot add product above ${BULK_PRODUCT_LIMIT}`);
      validationErrors.push(`At row ${row} :Cannot add product above ${BULK_PRODUCT_LIMIT}`);
    let row = 2;
    console.log("req.body.products", req.body.products);
    for (const product of req.body.products) {
      Object.keys(product).forEach((item) => {
        if (!allowedValues.includes(item))
          return res.sendError(httpStatus.CONFLICT, `Field ${item} is invalid`, "Failed to add Bulk Products");
      });
    }
    for (const product of req.body.products) {
      product["name"] = product["Name"];
      product["description"] = product["Description"];
      product["volume"] = product["Volume in cm3"];
      product["weight"] = product["Weight"];
      product["category"] = product["Category"];
      product["brand"] = product["Brand"];
      product["uom"] = product["Uom"];
      product["isActive"] = product["IsActive"];

      const productAlreadyExist = await Dao.Product.findOne({ where: { name: product.name } });
      if (productAlreadyExist)
        // return res.sendError(
        //   httpStatus.CONFLICT,
        //   `Product Already Exist with name ${productAlreadyExist.name} at row ${row}`
        // );
        validationErrors.push(`At row ${row} :Product Already Exist with name ${productAlreadyExist.name}`);

      if (product["isActive"] !== "TRUE" && product["isActive"] !== "FALSE")
        // return res.sendError(
        //   httpStatus.CONFLICT,
        //   `${product.name} has invalid value for column isActive ${product.isActive} at row ${row}`
        // );
        validationErrors.push(
          `At row ${row} :{product.name} has invalid value for column isActive ${product.isActive}`
        );

      product["userId"] = req.userId;
      product["isActive"] = product["isActive"] === "TRUE" ? 1 : 0;
      product["dimensionsCBM"] = product["volume"];
      const category = await Dao.Category.findOne({ where: { name: product.category } });
      const brand = await Dao.Brand.findOne({ where: { name: product.brand } });
      const uom = await Dao.UOM.findOne({ where: { name: product.uom } });
      if (category && brand && uom) {
        product["categoryId"] = category.id;
        product["brandId"] = brand.id;
        product["uomId"] = uom.id;
      } else if (!category) {
        // return res.sendError(
        //   httpStatus.CONFLICT,
        //   `Category Doesn't exist with name ${product.category} for product ${product.name} at row ${row}`,
        //   "Failed to add Bulk Products"
        // );
        validationErrors.push(
          `At row ${row} :Category Doesn't exist with name ${product.category} for product ${product.name}`
        );
      } else if (!brand) {
        // return res.sendError(
        //   httpStatus.CONFLICT,
        //   `Brand Doesn't exist with name ${product.brand} for product ${product.name} at row ${row}`,
        //   "Failed to add Bulk Products"
        // );
        validationErrors.push(
          `At row ${row} :Brand Doesn't exist with name ${product.brand} for product ${product.name} `
        );
      } else if (!uom) {
        // return res.sendError(
        //   httpStatus.CONFLICT,
        //   `Uom Doesn't exist with name ${product.uom} for product ${product.name} at row ${row}`,
        //   "Failed to add Bulk Products"
        // );
        validationErrors.push(`At row ${row} :Uom Doesn't exist with name ${product.uom} for product ${product.name}`);
      }
      row++;
    }

    if (validationErrors.length) res.sendError(httpStatus.CONFLICT, validationErrors, "Failed to add bulk Products");
    // });
    products = await Product.bulkCreate(req.body.products);
    // await ActivityLog.bulkCreate({
    //   userId: req.userId,

    // });
  } catch (err) {
    console.log("err", err);
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
  // } else {
  //   return { status: httpStatus.UNPROCESSABLE_ENTITY, message: isValid, code: "Validation Error" };
  // }
});

/* PUT update existing product. */
router.put("/:id", activityLog, async (req, res, next) => {
  let product = await Product.findOne({ where: { id: req.params.id } });
  if (!product)
    return res.status(400).json({
      success: false,
      message: "No product found!",
    });
  product.name = req.body.name;
  product.description = req.body.description;
  product.dimensionsCBM = req.body.dimensionsCBM;
  product.weight = req.body.weight;
  product.categoryId = req.body.categoryId;
  product.brandId = req.body.brandId;
  product.uomId = req.body.uomId;
  product.isActive = req.body.isActive;
  try {
    const response = await product.save();
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

module.exports = router;
