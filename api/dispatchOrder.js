const express = require("express");
const router = express.Router();
const {
  Inventory,
  DispatchOrder,
  OrderGroup,
  Company,
  Warehouse,
  Product,
  UOM,
  sequelize,
  ProductOutward,
} = require("../models");
const config = require("../config");
const { Op, fn, col } = require("sequelize");
const authService = require("../services/auth.service");
const { digitize, addActivityLog } = require("../services/common.services");
const { RELATION_TYPES } = require("../enums");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const moment = require("moment-timezone");

/* GET dispatchOrders listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search)
    where[Op.or] = ["$Inventory.Company.name$", "$Inventory.Warehouse.name$"].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
  const response = await DispatchOrder.findAndCountAll({
    include: [
      {
        model: Inventory,
        as: "Inventory",
        required: true,
        include: [
          { model: Product, include: [{ model: UOM }] },
          { model: Company, required: true },
          { model: Warehouse, required: true },
        ],
      },
      {
        model: Inventory,
        as: "Inventories",
        required: true,
        include: [{ model: Product, include: [{ model: UOM }] }, Company, Warehouse],
      },
    ],
    order: [["updatedAt", "DESC"]],
    distinct: true,
    where,
    limit,
    offset,
    distinct: true,
  });

  for (const { dataValues } of response.rows) {
    dataValues["ProductOutwards"] = await ProductOutward.findAll({
      include: ["OutwardGroups", "Vehicle"],
      attributes: ["quantity", "referenceId", "internalIdForBusiness"],
      required: false,
      where: { dispatchOrderId: dataValues.id },
    });
  }
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
  });
});

/* POST create new dispatchOrder. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New dispatchOrder registered";
  let dispatchOrder;
  req.body["shipmentDate"] = new Date(moment(req.body["shipmentDate"]).tz("Africa/Abidjan"));
  req.body.inventories = req.body.inventories || [{ id: req.body.inventoryId, quantity: req.body.quantity }];

  try {
    await sequelize.transaction(async (transaction) => {
      dispatchOrder = await DispatchOrder.create(
        {
          userId: req.userId,
          ...req.body,
        },
        { transaction }
      );
      const numberOfInternalIdForBusiness = digitize(dispatchOrder.id, 6);
      dispatchOrder.internalIdForBusiness = req.body.internalIdForBusiness + numberOfInternalIdForBusiness;
      let sumOfComitted = [];
      let comittedAcc;
      req.body.inventories.forEach((Inventory) => {
        let quantity = parseInt(Inventory.quantity);
        sumOfComitted.push(quantity);
      });
      comittedAcc = sumOfComitted.reduce((acc, po) => {
        return acc + po;
      });
      dispatchOrder.quantity = comittedAcc;
      await dispatchOrder.save({ transaction });
      let inventoryIds = [];
      inventoryIds = req.body.inventories.map((inventory) => {
        return inventory.id;
      });
      const toFindDuplicates = (arry) => arry.filter((item, index) => arry.indexOf(item) != index);
      const duplicateElements = toFindDuplicates(inventoryIds);
      if (duplicateElements.length != 0) {
        throw new Error("Can not add same inventory twice");
      }

      await OrderGroup.bulkCreate(
        req.body.inventories.map((inventory) => ({
          userId: req.userId,
          orderId: dispatchOrder.id,
          inventoryId: inventory.id,
          quantity: inventory.quantity,
        })),
        { transaction }
      );

      return Promise.all(
        req.body.inventories.map((_inventory) => {
          return Inventory.findByPk(_inventory.id, { transaction }).then((inventory) => {
            if (!inventory && !_inventory.id) throw new Error("Inventory is not available");
            if (_inventory.quantity > inventory.availableQuantity)
              throw new Error("Cannot create orders above available quantity");
            try {
              inventory.committedQuantity += +_inventory.quantity;
              inventory.availableQuantity -= +_inventory.quantity;
              return inventory.save({ transaction });
            } catch (err) {
              throw new Error(err.errors.pop().message);
            }
          });
        })
      );
    });
    res.json({
      success: true,
      message,
      data: dispatchOrder,
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.toString().replace("Error: ", ""),
    });
  }
});

/* PUT update existing dispatchOrder. */
router.put("/:id", activityLog, async (req, res, next) => {
  let dispatchOrder = await DispatchOrder.findOne({ where: { id: req.params.id }, include: ["Inventories"] });
  if (!dispatchOrder)
    return res.status(400).json({
      success: false,
      message: "No dispatchOrder found!",
    });
  if (req.body.hasOwnProperty("shipmentDate")) dispatchOrder.shipmentDate = req.body.shipmentDate;
  if (req.body.hasOwnProperty("receiverName")) dispatchOrder.receiverName = req.body.receiverName;
  if (req.body.hasOwnProperty("receiverPhone")) dispatchOrder.receiverPhone = req.body.receiverPhone;
  if (req.body.hasOwnProperty("referenceId")) dispatchOrder.referenceId = req.body.referenceId;
  if (req.body.hasOwnProperty("products")) await updateDispatchOrderInventories(dispatchOrder, req.body.products);
  try {
    const response = await dispatchOrder.save();
    return res.json({
      success: true,
      message: "Dispatch Order updated",
      data: response,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
});

const updateDispatchOrderInventories = async (DO, products) => {
  console.log("DO.Inventories1", DO.Inventories);
  for (const product of products) {
    DO.Inventories = DO.Inventories.filter((inv) => {
      console.log("inv === product.inventoryId", inv.id === product.inventoryId);
      return inv.id === product.inventoryId;
    });
  }
  console.log("DO.Inventories", DO.Inventories);
};

router.delete("/:id", activityLog, async (req, res, next) => {
  let response = await DispatchOrder.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "DispatchOrder deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No dispatchOrder found!",
    });
});

router.get("/relations", async (req, res, next) => {
  let where = { isActive: true };
  if (!authService.isSuperAdmin(req)) where.contactId = req.userId;
  const customers = await Company.findAll({
    where: {
      ...where,
      relationType: RELATION_TYPES.CUSTOMER,
    },
  });
  res.json({
    success: true,
    message: "respond with a resource",
    customers,
  });
});

router.get("/inventory", async (req, res, next) => {
  if (req.query.customerId && req.query.warehouseId && req.query.productId) {
    const inventory = await Inventory.findOne({
      where: {
        customerId: req.query.customerId,
        warehouseId: req.query.warehouseId,
        productId: req.query.productId,
      },
    });
    res.json({
      success: true,
      message: "respond with a resource",
      inventory,
    });
  } else
    res.json({
      success: false,
      message: "No inventory found",
    });
});

router.get("/warehouses", async (req, res, next) => {
  if (req.query.customerId) {
    const inventories = await Inventory.findAll({
      where: {
        customerId: req.query.customerId,
      },
      attributes: ["warehouseId", fn("COUNT", col("warehouseId"))],
      include: [
        {
          model: Warehouse,
        },
      ],
      group: "warehouseId",
    });
    res.json({
      success: true,
      message: "respond with a resource",
      warehouses: inventories.map((inventory) => inventory.Warehouse),
    });
  } else
    res.json({
      success: false,
      message: "No inventory found",
    });
});

router.get("/products", async (req, res, next) => {
  if (req.query.customerId) {
    const inventories = await Inventory.findAll({
      where: {
        customerId: req.query.customerId,
        warehouseId: req.query.warehouseId,
        availableQuantity: {
          [Op.ne]: 0,
        },
      },
      attributes: ["productId", fn("COUNT", col("productId"))],
      include: [
        {
          model: Product,
          include: [{ model: UOM }],
        },
      ],
      group: "productId",
    });
    res.json({
      success: true,
      message: "respond with a resource",
      products: inventories.map((inventory) => inventory.Product),
    });
  } else
    res.json({
      products: [],
      success: false,
      message: "No inventory found",
    });
});

module.exports = router;
