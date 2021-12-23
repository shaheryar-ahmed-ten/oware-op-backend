const express = require("express");
const router = express.Router();
const model = require("../models");
const {
  OrderGroup,
  Inventory,
  ProductOutward,
  OutwardGroup,
  Vehicle,
  Car,
  CarMake,
  CarModel,
  DispatchOrder,
  ProductInward,
  Company,
  Warehouse,
  Product,
  UOM,
  sequelize,
  User,
} = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const { digitize, checkOrderStatusAndUpdate } = require("../services/common.services");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const { DISPATCH_ORDER } = require("../enums");
const Joi = require("joi");
const httpStatus = require("http-status");
const ExcelJS = require("exceljs");
const authService = require("../services/auth.service");
const moment = require("moment-timezone");

const BulkAddValidation = Joi.object({
  dispatchOrderId: Joi.required(),
  referenceId: Joi.required(),
  vehicleId: Joi.optional(),
  externalVehicle: Joi.optional(),
  // isInternal: Joi.optional(),
  inventories: Joi.array().items(
    Joi.object({
      quantity: Joi.number().integer().min(1).required(),
      id: Joi.number().integer().min(1).required(),
      availableQuantity: Joi.number().integer().min(1).required(),
    })
  ),
  internalIdForBusiness: Joi.required(),
});

/* GET productOutwards listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };

  if (req.query.search)
    where[Op.or] = [
      "internalIdForBusiness",
      "$DispatchOrder.Inventory.Company.name$",
      "$DispatchOrder.Inventory.Warehouse.name$",
      "$DispatchOrder.internalIdForBusiness$",
      // "$Inventories->Product.name$"
    ].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.startingDate && req.query.endingDate) {
    const startDate = moment(req.query.startingDate).utcOffset("+05:00").set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const endDate = moment(req.query.endingDate).utcOffset("+05:00").set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 1000,
    });
    where["createdAt"] = { [Op.between]: [startDate, endDate] };
  }

  const response = await ProductOutward.findAndCountAll({
    duplicating: false,
    include: [
      {
        duplicating: false,
        model: DispatchOrder,
        required: true,
        include: [
          {
            model: Inventory,
            required: true,
            as: "Inventory",
            include: [
              { model: Product, include: [{ model: UOM }] },
              { model: Company, required: true },
              { model: Warehouse, required: true },
            ],
          },
          {
            model: Inventory,
            required: true,
            as: "Inventories",
            include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
          },
        ],
      },
      {
        model: Vehicle,
        include: [{ model: Car, include: [CarMake, CarModel] }],
      },
      {
        model: Inventory,
        as: "Inventories",
        required: true,
        include: [
          { model: Product, as: "Product", include: [{ model: UOM }] },
          { model: Company },
          { model: Warehouse },
        ],
      },
      { model: User },
    ],
    order: [["updatedAt", "DESC"]],
    where,
    limit,
    offset,
    distinct: true,
    // logging: true,
    // subQuery: false
  });

  var acc = [];
  response.rows.forEach((productOutward) => {
    var sum = [];
    productOutward.DispatchOrder.Inventories.forEach((Inventory) => {
      sum.push(Inventory.OrderGroup.quantity);
    });
    acc.push(
      sum.reduce((acc, po) => {
        return acc + po;
      })
    );
  });
  for (let index = 0; index < acc.length; index++) {
    response.rows[index].DispatchOrder.quantity = acc[index];
  }

  var comittedAcc = [];
  response.rows.forEach((productOutward) => {
    var sumOfComitted = [];
    productOutward.Inventories.forEach((Inventory) => {
      sumOfComitted.push(Inventory.OutwardGroup.quantity);
    });
    comittedAcc.push(
      sumOfComitted.reduce((acc, po) => {
        return acc + po;
      })
    );
  });
  for (let index = 0; index < comittedAcc.length; index++) {
    response.rows[index].quantity = comittedAcc[index];
  }

  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
    count: response.count,
  });
});

router.get("/export", async (req, res, next) => {
  let where = {};
  if (!authService.isSuperAdmin(req)) where["$Company.contactId$"] = req.userId;

  let workbook = new ExcelJS.Workbook();

  worksheet = workbook.addWorksheet("Product Outwards");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

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
    "TRANSPORTATION TYPE",
  ]);

  if (req.query.search)
    where[Op.or] = [
      "internalIdForBusiness",
      "$DispatchOrder.Inventories.Company.name$",
      "$DispatchOrder.Inventories.Warehouse.name$",
      "$DispatchOrder.internalIdForBusiness$",
      // "$Inventories->Product.name$"
    ].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.startingDate && req.query.endingDate) {
    const startDate = moment(req.query.startingDate).utcOffset("+05:00").set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const endDate = moment(req.query.endingDate).utcOffset("+05:00").set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 1000,
    });
    where["createdAt"] = { [Op.between]: [startDate, endDate] };
  }

  response = await ProductOutward.findAll({
    include: [
      {
        model: DispatchOrder,
        include: [
          {
            model: Inventory,
            as: "Inventories",
            include: [
              { model: Product, include: [{ model: UOM, attributes: ["name"] }], attributes: ["name"] },
              { model: Company, attributes: ["name"], required: true },
              { model: Warehouse, attributes: ["name"], required: true },
            ],
            required: true,
          },
        ],
        attributes: ["receiverName", "receiverPhone", "shipmentDate"],
        required: true,
      },
      { model: User, attributes: ["firstName", "lastName"] },
    ],
    attributes: ["id", "internalIdForBusiness", "referenceId", "createdAt", "externalVehicle"],
    order: [["updatedAt", "DESC"]],
    where,
  });

  const outwardArray = [];
  for (const outward of response) {
    for (const inv of outward.DispatchOrder.Inventories) {
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
        inv.OrderGroup.quantity || 0,
        OutG ? OutG.quantity || 0 : "Not available",
        // OutG.quantity || 0,
        moment(outward.DispatchOrder.shipmentDate).format("DD/MM/yy HH:mm"),
        moment(outward.createdAt).tz(req.query.client_Tz).format("DD/MM/yy HH:mm"),
        outward.externalVehicle ? "Customer Provided" : "Oware Provided",
      ]);
    }
  }

  worksheet.addRows(outwardArray);

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});

/* POST create new productOutward. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New productOutward registered";
  let dispatchOrder = await DispatchOrder.findByPk(req.body.dispatchOrderId, { include: [ProductOutward] });
  if (!dispatchOrder)
    return res.json({
      success: false,
      message: "No dispatch order found",
    });
  if (dispatchOrder.status === DISPATCH_ORDER.STATUS.FULFILLED)
    return res.json({
      success: false,
      message: "Dispatch Order already fulfilled",
    });
  req.body.inventories = req.body.inventories || [{ id: req.body.inventoryId, quantity: req.body.quantity }];

  try {
    const isValid = await BulkAddValidation.validateAsync(req.body);
    if (isValid) {
      await sequelize.transaction(async (transaction) => {
        productOutward = await ProductOutward.create(
          {
            userId: req.userId,
            ...req.body,
          },
          { transaction }
        );
        const numberOfInternalIdForBusiness = digitize(productOutward.id, 6);
        productOutward.internalIdForBusiness = req.body.internalIdForBusiness + numberOfInternalIdForBusiness;
        let sumOfOutwards = [];
        let outwardAcc;
        // await req.body.inventories.forEach(async (Inventory) => {
        for (const Inventory of req.body.inventories) {
          const OG = await OrderGroup.findOne({
            where: {
              orderId: req.body.dispatchOrderId,
              inventoryId: Inventory.id,
            },
          });
          if (!OG) {
            return res.sendError(
              httpStatus.CONFLICT,
              "Cannot create outward having products other than ordered products"
            );
          }
          if (Inventory.quantity > OG.quantity) {
            return res.sendError(httpStatus.CONFLICT, "Outward quantity cant be greater than dispatch order quantity");
          }
          let quantity = parseInt(Inventory.quantity);
          sumOfOutwards.push(quantity);
        }
        outwardAcc = sumOfOutwards.reduce((acc, po) => {
          return acc + po;
        });
        productOutward.quantity = outwardAcc;
        await productOutward.save({ transaction });

        await OutwardGroup.bulkCreate(
          req.body.inventories.map((inventory) => ({
            userId: req.userId,
            outwardId: productOutward.id,
            inventoryId: inventory.id,
            quantity: inventory.quantity,
            availableQuantity: inventory.availableQuantity,
          })),
          { transaction }
        );

        await checkOrderStatusAndUpdate(model, req.body.dispatchOrderId, productOutward.quantity, transaction);

        return Promise.all(
          req.body.inventories.map((_inventory) => {
            return Inventory.findByPk(_inventory.id, { transaction }).then((inventory) => {
              if (!inventory && !_inventory.id) throw new Error("Inventory is not available");
              if (_inventory.quantity > inventory.committedQuantity)
                throw new Error("Cannot create orders above available quantity");
              try {
                inventory.dispatchedQuantity += +_inventory.quantity;
                inventory.committedQuantity -= +_inventory.quantity;
                return inventory.save({ transaction });
              } catch (err) {
                throw new Error(err.errors.pop().message);
              }
            });
          })
        );
      });
      return res.json({
        success: true,
        message,
        data: productOutward,
      });
    } else {
    }

    // TODO: // The following validations needs to be implemented for multi inventory outward
    // let availableOrderQuantity = dispatchOrder.quantity - dispatchOrder.ProductOutwards.reduce((acc, outward) => acc += outward.quantity, 0);
    // if (req.body.quantity > availableOrderQuantity) return res.json({
    //   success: false,
    //   message: 'Cannot dispatch above ordered quantity'
    // })
    // if (req.body.quantity > dispatchOrder.Inventory.committedQuantity) return res.json({
    //   success: false,
    //   message: 'Cannot dispatch above available inventory quantity'
    // })
  } catch (err) {
    res.json({
      success: false,
      message: err.toString().replace("Error: ", ""),
    });
  }
  res.json({
    success: true,
    message,
    data: productOutward,
  });
});

/* PUT update existing productOutward. */
router.put("/:id", async (req, res, next) => {
  let productOutward = await ProductOutward.findOne({
    where: { id: req.params.id },
    include: [{ model: ProductInward }],
  });
  if (!productOutward)
    return res.status(400).json({
      success: false,
      message: "No productOutward found!",
    });
  await productOutward.ProductInward.save();
  productOutward.receiverName = req.body.receiverName;
  productOutward.receiverPhone = req.body.receiverPhone;
  productOutward.isActive = req.body.isActive;
  try {
    const response = await productOutward.save();
    return res.json({
      success: true,
      message: "Product Outward updated",
      data: response,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
});

router.delete("/:id", async (req, res, next) => {
  let response = await ProductOutward.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "ProductOutward deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No productOutward found!",
    });
});

router.get("/relations", async (req, res, next) => {
  const dispatchOrders = await DispatchOrder.findAll({
    include: [
      {
        model: Inventory,
        as: "Inventory",
        include: [
          { model: Company, attributes: ["id", "name"] },
          { model: Warehouse, attributes: ["id", "name", "businessWarehouseCode"] },
        ],
        attributes: ["id"],
      },
      {
        model: Inventory,
        as: "Inventories",
        include: [
          { model: Product, include: [{ model: UOM, attributes: ["id", "name"] }], attributes: ["id", "name"] },
        ],
        attributes: ["id"],
      },
      {
        model: ProductOutward,
        include: [
          {
            model: Inventory,
            as: "Inventories",
            include: [{ model: Product, attributes: ["id", "name"] }],
          },
        ],
        attributes: ["id"],
      },
    ],
    where: { status: { [Op.notIn]: [DISPATCH_ORDER.STATUS.FULFILLED, DISPATCH_ORDER.STATUS.CANCELLED] } },
    attributes: [
      "id",
      "internalIdForBusiness",
      "referenceId",
      "shipmentDate",
      "receiverName",
      "receiverPhone",
      "createdAt",
    ],
    order: [["updatedAt", "DESC"]],
  });

  const vehicles = await Vehicle.findAll({ where: { isActive: true }, attributes: ["id", "registrationNumber"] });
  res.json({
    success: true,
    message: "respond with a resource",
    dispatchOrders,
    vehicles,
  });
});

router.get("/:id", async (req, res, next) => {
  // find PO
  let productOutward = await Dao.ProductOutward.findOne({
    where: { id: req.params.id },
    include: [
      {
        duplicating: false,
        model: DispatchOrder,
        required: true,
        include: [
          {
            model: Inventory,
            required: true,
            as: "Inventory",
            include: [
              { model: Product, include: [{ model: UOM }] },
              { model: Company, required: true },
              { model: Warehouse, required: true },
            ],
          },
          {
            model: Inventory,
            required: true,
            as: "Inventories",
            include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }],
          },
        ],
      },
      {
        model: Vehicle,
        include: [{ model: Car, include: [CarMake, CarModel] }],
      },
      {
        model: Inventory,
        as: "Inventories",
        required: true,
        include: [
          { model: Product, as: "Product", include: [{ model: UOM }] },
          { model: Company },
          { model: Warehouse },
        ],
      },
      { model: User },
    ],
  });
  // Check if PO exists
  if (!productOutward)
    return res.status(400).json({
      success: false,
      message: "No productOutward found!",
    });

  return res.json({
    success: true,
    message: "Product Outward found",
    data: productOutward,
  });
});

module.exports = router;
