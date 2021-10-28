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
const { digitize, addActivityLog, getMaxValueFromJson } = require("../services/common.services");
const { RELATION_TYPES, DISPATCH_ORDER } = require("../enums");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const moment = require("moment-timezone");
const httpStatus = require("http-status");
const ExcelJS = require("exceljs");
const Joi = require("joi");

const AddValidation = Joi.object({
  orders: Joi.array().items(
    Joi.object({
      orderNumber: Joi.number().integer().required(),
      product: Joi.string().required(),
      warehouse: Joi.string().required(),
      company: Joi.string().required(),
      receiverName: Joi.string().required(),
      receiverPhone: Joi.string().required(),
      shipmentDate: Joi.date().required(),
      referenceId: Joi.number().integer().required(),
      quantity: Joi.number().integer().required(),
    })
  ),
});

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
  if (req.query.status) where = { status: req.query.status };
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
  req.body.inventories = req.body.inventories.filter((inv) => {
    if (inv.quantity > 0) return inv;
  });
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

router.post("/bulk", activityLog, async (req, res, next) => {
  try {
    const isValid = await AddValidation.validateAsync(params);
    if (isValid) {
      await sequelize.transaction(async (transaction) => {
        const validationErrors = [];
        let row = 1;
        let previousOrderNumber = 1;
        let count = 1;

        console.log("req.body", req.body);

        for (const order of req.body.orders) {
          ++row;
          const customer = await Dao.Company.findOne({
            where: {
              where: sequelize.where(sequelize.fn("BINARY", sequelize.col("name")), order.company.trim()),
              isActive: 1,
            },
            attributes: ["id"],
            logging: true,
          });
          if (!customer) validationErrors.push({ row, message: `Row ${row} : Invalid Customer Name` });
          const warehouse = await Dao.Warehouse.findOne({
            where: {
              where: sequelize.where(sequelize.fn("BINARY", sequelize.col("name")), order.warehouse.trim()),
              isActive: 1,
            },
            attributes: ["id"],
          });
          if (!warehouse) validationErrors.push({ row, message: `Row ${row} : Invalid Warehouse Name` });
          const product = await Dao.Product.findOne({
            where: {
              where: sequelize.where(sequelize.fn("BINARY", sequelize.col("name")), order.product.trim()),
              isActive: 1,
            },
            attributes: ["id"],
          });
          if (!product) validationErrors.push({ row, message: `Row ${row} : Invalid Product Name` });

          if (customer) order.customerId = customer.id;
          if (product) order.productId = product.id;
          if (warehouse) order.warehouseId = warehouse.id;

          if (product && customer && warehouse) {
            order.customerId = customer.id;
            order.productId = product.id;
            order.warehouseId = warehouse.id;
            const inventory = await Dao.Inventory.findOne({
              attributes: ["id", "availableQuantity"],
              where: { productId: order.productId, customerId: order.customerId, warehouseId: order.warehouseId },
            });
            if (inventory) {
              order.inventoryId = inventory.id;
              if (inventory.availableQuantity < order.quantity)
                validationErrors.push({ row, message: `Cannot create orders above available quantity` });
            }
            if (!inventory) validationErrors.push({ row, message: `Row ${row} : Inventory doesn't exist` });
          }

          orderNumber = parseInt(order.orderNumber);
          if (orderNumber !== previousOrderNumber && orderNumber !== previousOrderNumber + 1)
            validationErrors.push({ row, message: `Row ${row} : Invalid Order Number` });

          previousOrderNumber = orderNumber;
        }

        if (validationErrors.length)
          return res.sendError(httpStatus.CONFLICT, validationErrors, "Failed to add bulk dispatch orders");

        let maxOrderNumber = getMaxValueFromJson(req.body.orders, "orderNumber").orderNumber;
        while (count <= maxOrderNumber) {
          orders = req.body.orders.filter((item) => item.orderNumber == count);
          await createOrder(orders, req.userId, transaction);
          count++;
        }
        if (validationErrors.length)
          return res.sendError(httpStatus.CONFLICT, validationErrors, "Failed to add bulk Products");
        res.sendJson(httpStatus.OK, "Bulk Dispatch Order Created", {});
      });
    } else {
      res.sendError(httpStatus.CONFLICT, "Validation Error", null);
    }
  } catch (err) {
    console.log("err", err);
    res.sendError(httpStatus.CONFLICT, "Server Error", err.message);
  }
});

//1.create DO
//2.make and create OG
//3.Update Inventories
const createOrder = async (orders, userId, transaction) => {
  dispatchOrder = await DispatchOrder.create(
    {
      userId,
      ...orders[0],
    },
    { transaction }
  );
  const businessWarehouseCode = (
    await Dao.Warehouse.findOne({
      where: { id: orders[0].warehouseId },
      attributes: ["businessWarehouseCode"],
    })
  ).businessWarehouseCode;
  const numberOfInternalIdForBusiness = digitize(dispatchOrder.id, 6);
  dispatchOrder.internalIdForBusiness = `DO-${businessWarehouseCode}-${numberOfInternalIdForBusiness}`;
  let sumOfComitted = [];
  orders.forEach((order) => {
    let quantity = parseInt(order.quantity);
    sumOfComitted.push(quantity);
  });
  comittedAcc = sumOfComitted.reduce((acc, po) => {
    return acc + po;
  });
  dispatchOrder.quantity = comittedAcc;
  await dispatchOrder.save({ transaction });
  await OrderGroup.bulkCreate(
    orders.map((order) => ({
      userId,
      orderId: dispatchOrder.id,
      inventoryId: order.inventoryId,
      quantity: order.quantity,
    })),
    { transaction }
  );

  return Promise.all(
    orders.map((_inventory) => {
      console.log("_inventory", _inventory);
      return Inventory.findByPk(_inventory.inventoryId, { transaction }).then((inventory) => {
        if (!inventory && !_inventory.inventoryId) throw new Error("Inventory is not available");
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
};

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
  DO.status = DISPATCH_ORDER.STATUS.FULFILLED;
  for (const product of products) {
    const inventory = await Dao.Inventory.findOne({ where: { id: product.inventoryId } });
    let OG = await Dao.OrderGroup.findOne({ where: { inventoryId: product.inventoryId, orderId: DO.id } });
    const PO = await Dao.ProductOutward.findAll({
      where: {
        dispatchOrderId: DO.id,
      },
      include: [{ model: OutwardGroup, where: { inventoryId: product.inventoryId } }],
    });
    let outwardQuantity = 0;
    for (const outward of PO) {
      if (outward.OutwardGroups && outward.OutwardGroups[0]) outwardQuantity += outward.OutwardGroups[0].quantity;
    }
    if (!OG) {
      OG = await Dao.OrderGroup.create({
        userId: userId,
        orderId: DO.id,
        inventoryId: product.inventoryId,
        quantity: product.quantity,
      });
      if (parseInt(product.quantity) > parseInt(inventory.availableQuantity)) {
        await OG.destroy();
        throw new Error("Cannot add quantity above available quantity");
      } else if (parseInt(outwardQuantity) > 0 && parseInt(product.quantity) < parseInt(outwardQuantity)) {
        await OG.destroy();
        throw new Error("Edited Dispatch order quantity cannot be less than total outward quantity");
      }

      inventory.availableQuantity = inventory.availableQuantity - product.quantity;
      inventory.committedQuantity = inventory.committedQuantity + product.quantity;
    } else {
      if (product.quantity > inventory.availableQuantity + OG.quantity)
        throw new Error("Cannot add quantity above available quantity");
      else if (outwardQuantity > 0 && product.quantity < outwardQuantity)
        throw new Error("Edited Dispatch order quantity cannot be less than total outward quantity");
      inventory.availableQuantity = inventory.availableQuantity + OG.quantity - product.quantity;
      inventory.committedQuantity =
        inventory.committedQuantity - (OG.quantity - outwardQuantity) + (product.quantity - outwardQuantity); //3-(5-3)+6
      OG.quantity = product.quantity > 0 ? product.quantity : OG.quantity;
    }
    if (product.quantity === 0) await OG.destroy();
    else await OG.save();
    await inventory.save();
    if (DO.status == DISPATCH_ORDER.STATUS.FULFILLED && product.quantity !== outwardQuantity)
      DO.status = DISPATCH_ORDER.STATUS.PARTIALLY_FULFILLED;
  }

  const outwardExist = await Dao.ProductOutward.findAll({
    where: {
      dispatchOrderId: DO.id,
    },
  });

  if (outwardExist.length === 0) DO.status = DISPATCH_ORDER.STATUS.PENDING;

  //Update DO total quantity
  let totalDoQty = 0;
  for (const product of products) {
    totalDoQty += product.quantity;
  }
  DO.quantity = totalDoQty;

  await DO.save();
};

router.patch("/cancel/:id", activityLog, async (req, res, next) => {
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

router.get("/bulk-template", async (req, res, next) => {
  let workbook = new ExcelJS.Workbook();

  let worksheet = workbook.addWorksheet("Dispatch Orders");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  worksheet.columns = getColumnsConfig([
    "Order Number",
    "Company",
    "Warehouse",
    "Receiver Name",
    "Receiver Phone",
    "Shipment Date",
    "Reference ID",
    "Product Name",
    "Quantity",
  ]);

  worksheet.addRows(
    [
      {
        orderNo: 1,
        company: "Bisconi Pvt",
        warehouse: "Karachi - east",
        receiverName: "Ahmed Ali",
        receiverPhone: "03xxxxxxxx0",
        shipmentDate: "12/25/2021 03:40 PM",
        referenceId: "ref-2031",
        productName: "COKE ZERO",
        quantity: 35,
      },
      {
        orderNo: 1,
        company: "Bisconi Pvt",
        warehouse: "Karachi - east",
        receiverName: "Ahmed Ali",
        receiverPhone: "03xxxxxxxx0",
        shipmentDate: "12/25/2021 03:40 PM",
        referenceId: "ref-2031",
        productName: "COKE",
        quantity: 150,
      },
      {
        orderNo: 2,
        company: "Nescafe Pvt",
        warehouse: "Karachi - south",
        receiverName: "Zafar",
        receiverPhone: "03xxxxxxxx0",
        shipmentDate: "11/16/2021 12:59 AM",
        referenceId: "ref-0031",
        productName: "7up",
        quantity: 90,
      },
    ].map((el, idx) => [
      el.orderNo,
      el.company,
      el.warehouse,
      el.receiverName,
      el.receiverPhone,
      el.shipmentDate,
      el.referenceId,
      el.productName,
      el.quantity,
    ])
  );

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
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

router.get("/whatsapp", async (req, res, next) => {
  const accountSid = "ACa8f41f9830e890f8260be0c610577d03";
  const authToken = "f6e6ad4a90f8224a58f7e265926f10dc";
  const client = require("twilio")(accountSid, authToken);

  client.messages
    .create({
      body: "Your Yummy Cupcakes Company order of 1 dozen frosted cupcakes has shipped and should be delivered on July 10, 2019. Details: http://www.yummycupcakes.com/",
      from: "whatsapp:+14155238886",
      to: "whatsapp:+923343696707",
    })
    .then((message) => console.log(message.sid))
    .done();
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
    //Include PO in DO's Inventories instead of directly including it
    const DO = await Dao.DispatchOrder.findOne(params);
    const PO = await Dao.ProductOutward.findAll({ where: { dispatchOrderId: req.params.id } });
    const outwardArr = [];
    for (const outward of PO) {
      outwardArr.push(outward.id);
    }
    for (const inv of DO.Inventories) {
      if (PO) {
        inv.dataValues["outwards"] = await OutwardGroup.findAll({
          where: { outwardId: { [Op.in]: outwardArr }, inventoryId: inv.id },
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

      inv.dataValues["outwardQty"] = inv.dataValues["outwards"].reduce((acc, item) => {
        return acc + item.quantity;
      }, 0);
    }
    // let outwardQty = 0;
    // for (const inv of DO.Inventories) {
    //   outwardQty += out.quantity;
    // }

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
