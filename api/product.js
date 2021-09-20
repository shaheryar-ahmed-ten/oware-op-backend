const express = require("express");
const router = express.Router();
const { Product, User, Brand, UOM, Category } = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const httpStatus = require("http-status");

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
  let message = "Bulk products registered";
  let products;
  try {
    const allowedValues = ["name", "description", "dimensionsCBM", "weight", "category", "brand", "uom", "isActive"];
    // req.body.products = req.body.products.map((product) => {
    for (const product of req.body.products) {
      console.log(`Object.keys(product)`, Object.keys(product));
      productArr = Object.keys(product);
      const fileFieldValidation = productArr.every((elem) => allowedValues.includes(elem));
      if (!fileFieldValidation) return res.sendError(httpStatus.CONFLICT, `File is invalid`);
      const productAlreadyExist = await Dao.Product.findOne({ where: { name: product.name } });
      if (productAlreadyExist)
        return res.sendError(httpStatus.CONFLICT, `Product Already Exist with name ${productAlreadyExist.name}`);
      product["userId"] = req.userId;
      product["isActive"] = product["isActive"] == "TRUE" ? 1 : 0;
      const category = await Dao.Category.findOne({ where: { name: product.category } });
      const brand = await Dao.Brand.findOne({ where: { name: product.brand } });
      const uom = await Dao.UOM.findOne({ where: { name: product.uom } });
      if (category && brand && uom) {
        product["categoryId"] = category.id;
        product["brandId"] = brand.id;
        product["uomId"] = uom.id;
      } else if (!category) {
        res.sendError(
          httpStatus.CONFLICT,
          `Category Doesn't exist with name ${product.category}`,
          "Failed to add Bulk Products"
        );
      } else if (!brand) {
        res.sendError(
          httpStatus.CONFLICT,
          `Brand Doesn't exist with name ${product.brand}`,
          "Failed to add Bulk Products"
        );
      } else if (!uom) {
        res.sendError(httpStatus.CONFLICT, `Uom Doesn't exist with name ${product.uom}`, "Failed to add Bulk Products");
      }
    }
    // });
    products = await Product.bulkCreate(req.body.products);
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
