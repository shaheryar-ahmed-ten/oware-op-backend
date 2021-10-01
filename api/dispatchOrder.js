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
  OutwardGroup,
} = require("../models");
const config = require("../config");
const { Op, fn, col } = require("sequelize");
const authService = require("../services/auth.service");
const { digitize, addActivityLog } = require("../services/common.services");
const { RELATION_TYPES, DISPATCH_ORDER } = require("../enums");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const moment = require("moment-timezone");
const httpStatus = require("http-status");

/* GET dispatchOrders listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search)
    where[Op.or] = ["$Inventory.Company.name$", "$Inventory.Warehouse.name$", "internalIdForBusiness"].map((key) => ({
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
        required: false,
        include: [{ model: Product, include: [{ model: UOM }] }, Company, Warehouse],
      },
    ],
    order: [["createdAt", "DESC"]],
    distinct: true,
    where,
    limit,
    offset,
    distinct: true,
  });

  for (const { dataValues } of response.rows) {
    dataValues["ProductOutwards"] = await ProductOutward.findAll({
      // include: [
      //   {
      //     model: OutwardGroup,
      //     attributes: [
      //       `userId`,
      //       `quantity`,
      //       `inventoryId`,
      //       `outwardId`,
      //       `availableQuantity`,
      //       `createdAt`,
      //       `updatedAt`,
      //       `deletedAt`,
      //     ],
      //   },
      //   "Vehicle",
      // ],
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
  try {
    if (req.body.hasOwnProperty("products"))
      await updateDispatchOrderInventories(dispatchOrder, req.body.products, req.userId);
    const response = await dispatchOrder.save();
    await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
    return res.json({
      success: true,
      message: "Dispatch Order updated",
      data: response,
    });
  } catch (err) {
    console.log("err:", err);
    return res.json({
      success: false,
      message: err.toString().replace("Error: ", ""),
    });
  }
});

const updateDispatchOrderInventories = async (DO, products, userId) => {
  for (const product of products) {
    const inventory = await Dao.Inventory.findOne({ where: { id: product.inventoryId } });
    console.log("product.inventoryId", product.inventoryId, "DO.id ", DO.id);
    let OG = await Dao.OrderGroup.findOne({ where: { inventoryId: product.inventoryId, orderId: DO.id } });
    const PO = await Dao.ProductOutward.findAll({
      where: {
        dispatchOrderId: DO.id,
      },
      include: [{ model: OutwardGroup, where: { inventoryId: product.inventoryId } }],
    });
    let outwardQuantity = 0;
    for (const outward of PO) {
      console.log("outward.OutwardGroups", outward.OutwardGroups);
      if (outward.OutwardGroups && outward.OutwardGroups[0]) outwardQuantity += outward.OutwardGroups[0].quantity;
    }
    if (!OG) {
      OG = await Dao.OrderGroup.create({
        userId: userId,
        orderId: DO.id,
        inventoryId: product.inventoryId,
        quantity: product.quantity,
      });
      if (product.quantity > inventory.availableQuantity + OG.quantity - outwardQuantity)
        throw new Error("Cannot add quantity above available quantity");
      inventory.availableQuantity = inventory.availableQuantity - product.quantity;
      inventory.committedQuantity = inventory.committedQuantity + product.quantity;
    } else {
      console.log(
        "inventory.availableQuantity",
        inventory.availableQuantity,
        "OG.quantity",
        OG.quantity,
        "product.quantity",
        product.quantity,
        "outwardQuantity",
        outwardQuantity
      ); //4 + (5-3) - 6 = 3
      if (product.quantity > inventory.availableQuantity + OG.quantity - outwardQuantity)
        throw new Error("Cannot add quantity above available quantity");
      inventory.availableQuantity = inventory.availableQuantity + OG.quantity - product.quantity;
      inventory.committedQuantity =
        inventory.committedQuantity - (OG.quantity - outwardQuantity) + (product.quantity - outwardQuantity); //3-(5-3)+6
      OG.quantity = product.quantity > 0 ? product.quantity : OG.quantity;
    }
    console.log(
      "inventory.availableQuantity + OG.quantity - outwardQuantity",
      inventory.availableQuantity + OG.quantity - outwardQuantity
    );

    OG.save();
    inventory.save();
    if (product.quantity === outwardQuantity) {
      DO.status = DISPATCH_ORDER.STATUS.FULFILLED;
      await DO.save();
    }
  }
};

router.put("/cancel/:id", activityLog, async (req, res, next) => {
  let dispatchOrder = await DispatchOrder.findOne({ where: { id: req.params.id }, include: ["Inventories"] });
  if (!dispatchOrder) return res.sendError(httpStatus.CONFLICT, "No Dispatch Order Found");
  if (dispatchOrder.status == DISPATCH_ORDER.STATUS.CANCELLED)
    return res.sendError(httpStatus.CONFLICT, "Dispatch Order Already Cancelled");
  if (
    dispatchOrder.status === DISPATCH_ORDER.STATUS.PARTIALLY_FULFILLED ||
    dispatchOrder.status === DISPATCH_ORDER.STATUS.FULFILLED
  )
    return res.sendError(httpStatus.CONFLICT, "Cannot cancel Dispatch Order having one or more outwards");
  dispatchOrder.status = DISPATCH_ORDER.STATUS.CANCELLED;
  await dispatchOrder.save();
  let OGs = await Dao.OrderGroup.findAll({ where: { orderId: dispatchOrder.id } });
  for (const OG of OGs) {
    const inventory = await Dao.Inventory.findOne({ where: { id: OG.inventoryId } });
    inventory.availableQuantity = inventory.availableQuantity + OG.quantity;
    inventory.committedQuantity = inventory.committedQuantity - OG.quantity;
    await inventory.save();
    // await Dao.OrderGroup.destroy({ where: { id: OG.id } });
  }
  return res.sendJson(httpStatus.OK, "Dispatch Order Cancelled");
});

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

// Get single dispatch order
router.get("/:id", async (req, res, next) => {
  try {
    const params = {
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
      where: { id: req.params.id },
    };
    const DO = await Dao.DispatchOrder.findOne(params);
    const PO = await Dao.ProductOutward.findOne({ where: { dispatchOrderId: req.params.id } });
    for (const inv of DO.Inventories) {
      if (PO) {
        inv.dataValues["outward"] = await OutwardGroup.findOne({
          where: { outwardId: PO.id, inventoryId: inv.id },
          logging: console.log,
          attributes: [
            `userId`,
            `quantity`,
            `inventoryId`,
            `outwardId`,
            `availableQuantity`,
            `createdAt`,
            `updatedAt`,
            `deletedAt`,
          ],
        });
      }
    }
    res.json({ success: true, message: "Data Found", data: DO });
  } catch (err) {
    console.log("err", err);
    res.json({
      success: false,
      message: err.toString().replace("Error: ", ""),
    });
  }
});

module.exports = router;
