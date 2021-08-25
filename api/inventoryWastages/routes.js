const router = require("express").Router();
const controller = require("./controller");
const httpStatus = require("http-status");
const config = require("../../config");
const { Inventory, Company, Warehouse } = require("../../models");

router.get("/", async (req, res) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  const params = {
    limit,
    offset,
    include: [{ model: Inventory, as: "Inventory", include: ["Company", "Warehouse"] }],
    attributes: ["id", ["type", "reasonType"], ["reason", "comment"], "adjustmentQuantity"]
  };
  const response = await controller.getWastages(params);
  if (response.success === httpStatus.OK)
    res.sendJson(response.data, response.message, response.success, response.pages);
  else res.sendError(response.status, response.message, response.error);
});

router.get("/:id", async (req, res) => {
  const params = {
    include: [{ model: Inventory, as: "Inventory", include: ["Company", "Warehouse"] }],
    attributes: ["id", ["type", "reasonType"], ["reason", "comment"], "adjustmentQuantity"],
    where: { id: req.params.id }
  };
  const response = await controller.getWastageById(params);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.error);
});

router.put("/:id", async (req, res) => {
  const params = {
    include: [{ model: Inventory, as: "Inventory" }],
    attributes: ["id", ["type", "reasonType"], ["reason", "comment"], "adjustmentQuantity"],
    where: { id: req.params.id }
  };
  const response = await controller.updateWastage(params, req.body);
  if (response.status === httpStatus.OK)
    res.sendJson(response.data, response.message, response.success, Math.ceil(response.count / limit));
  else res.sendError(response.status, response.message, response.error);
});

router.post("/", async (req, res) => {
  const response = await controller.addWastages(req.body);
  if (response.status === httpStatus.OK)
    res.sendJson(response.data, response.message, response.success, Math.ceil(response.count / limit));
  else res.sendError(response.status, response.message, response.code);
});

module.exports = router;
