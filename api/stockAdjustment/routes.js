const router = require("express").Router();
const controller = require("./controller");
const httpStatus = require("http-status");
const config = require("../../config");
const {
  Inventory,
  Company,
  Warehouse,
  Product,
  UOM,
  User,
  StockAdjustment,
  AdjustmentInventory
} = require("../../models");
const { Op } = require("sequelize");
const moment = require("moment");

router.get("/wastages-type", async (req, res) => {
  const params = { where: {} };
  const response = await controller.getWastagesType(params);
  if (response.success === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.success, response.message, response.error);
});
router.get("/", async (req, res) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  const where = {};
  if (req.query.search)
    where[Op.or] = ["$Admin.firstName$", "$Admin.lastName$"].map(key => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" }
    }));
  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  }
  if (req.query.internalIdForBusiness) where["internalIdForBusiness"] = { [Op.eq]: req.query.internalIdForBusiness };
  // if (req.query.warehouse) where["$Inventory.Warehouse.id$"] = { [Op.eq]: req.query.warehouse };

  // if (req.query.company) where["$Inventory.Company.id$"] = { [Op.eq]: req.query.company };
  const params = {
    limit,
    offset,
    include: [
      {
        model: Inventory,
        as: "Inventories",
        required: true,
        include: [
          { model: Product, as: "Product", include: [{ model: UOM }] },
          "Company",
          "Warehouse",
          { model: AdjustmentInventory, as: "AdjustmentDetails", include: ["WastagesType"] }
        ]
      },
      { model: User, as: "Admin", attributes: ["id", "firstName", "lastName"], required: true }
    ],
    where,
    sort: [["createdAt", "DESC"]]
  };
  const response = await controller.getWastages(params);
  if (response.success === httpStatus.OK)
    res.sendJson(response.data, response.message, response.success, response.pages);
  else res.sendError(response.status, response.message, response.error);
});

router.get("/relations", async (req, res) => {
  const params = {
    where: {},
    include: [
      {
        model: Inventory,
        as: "Inventories",
        include: [{ model: StockAdjustment, as: "StockAdjustment", required: true }],
        required: true
      }
    ],
    group: ["id", "name"],
    attributes: ["id", "name"]
  };
  const response = await controller.getRelations(params);
  if (response.success === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.success, response.message, response.error);
});

router.delete("/:id", async (req, res) => {
  const response = await controller.deleteWastage(req.params.id);
  if (response.success === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.success, response.message, response.code);
});

router.get("/:id", async (req, res) => {
  const params = {
    include: [
      {
        model: Inventory,
        as: "Inventories",
        required: true,
        include: [
          { model: Product, as: "Product", include: [{ model: UOM }] },
          "Company",
          "Warehouse",
          { model: AdjustmentInventory, as: "AdjustmentDetails", include: ["WastagesType"] }
        ]
      },
      { model: User, as: "Admin", attributes: ["id", "firstName", "lastName"] }
    ],
    where: { id: req.params.id }
  };
  const response = await controller.getWastageById(params);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.error);
});

router.put("/:id", async (req, res) => {
  const params = {
    include: [{ model: Inventory, as: "Inventories" }],
    where: { id: req.params.id }
  };
  const response = await controller.updateWastage(params, req.body["adjustment_products"]);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.error);
});

router.post("/", async (req, res) => {
  const response = await controller.addWastages(req.body["adjustment_products"], req.userId);
  if (response.success === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.code);
});

module.exports = router;
