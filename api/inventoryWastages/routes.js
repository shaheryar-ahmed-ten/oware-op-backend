const router = require("express").Router();
const controller = require("./controller");
const httpStatus = require("http-status");
const config = require("../../config");
const { Inventory, Company, Warehouse, Product, UOM } = require("../../models");
const { Op, fn, col } = require("sequelize");

router.get("/", async (req, res) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  const where = {};
  if (req.query.search)
    where[Op.or] = ["$Inventory.Company.name$", "$Inventory.Warehouse.name$", "$Inventory.Product.name$"].map(key => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" }
    }));

  // if (req.query.warehouse)
  //   where[Op.or] = ["$Inventory.Warehouse.name$"].map(key => ({
  //     [key]: { [Op.eq]: req.query.warehouse }
  //   }));

  // if (req.query.company)
  //   where[Op.or].push(
  //     ["$Inventory.Company.name$"].map(key => ({
  //       [key]: { [Op.eq]: req.query.company }
  //     }))
  //   );
  // where[Op.or] = ["$Inventory.Company.name$"].map(key => ({
  //   [key]: { [Op.eq]: req.query.company }
  // }));

  // if (req.query.product)
  //   where[Op.or].push(
  //     ["$Inventory.P roduct.name$"].map(key => ({
  //       [key]: { [Op.eq]: req.query.product }
  //     }))
  //   );
  console.log("where", where);
  const params = {
    limit,
    offset,
    include: [
      {
        model: Inventory,
        as: "Inventory",
        include: [{ model: Product, as: "Product", include: [{ model: UOM }] }, "Company", "Warehouse"]
      }
    ],
    attributes: ["id", ["type", "reasonType"], ["reason", "comment"], "adjustmentQuantity", "createdAt"],
    where
  };
  const response = await controller.getWastages(params);
  if (response.success === httpStatus.OK)
    res.sendJson(response.data, response.message, response.success, response.pages);
  else res.sendError(response.status, response.message, response.error);
});

router.get("/:id", async (req, res) => {
  const params = {
    include: [
      {
        model: Inventory,
        as: "Inventory",
        include: [{ model: Product, as: "Product", include: [{ model: UOM }] }, "Company", "Warehouse"]
      }
    ],
    attributes: ["id", ["type", "reasonType"], ["reason", "comment"], "adjustmentQuantity", "createdAt"],
    where: { id: req.params.id }
  };
  const response = await controller.getWastageById(params);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.error);
});

router.put("/:id", async (req, res) => {
  const params = {
    include: [{ model: Inventory, as: "Inventory" }],
    attributes: ["id", ["type", "reasonType"], ["reason", "comment"], "adjustmentQuantity", "createdAt"],
    where: { id: req.params.id }
  };
  const response = await controller.updateWastage(params, req.body);
  if (response.status === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.error);
});

router.post("/", async (req, res) => {
  const response = await controller.addWastages(req.body);
  if (response.success === httpStatus.OK) res.sendJson(response.data, response.message, response.success);
  else res.sendError(response.status, response.message, response.code);
});

module.exports = router;
