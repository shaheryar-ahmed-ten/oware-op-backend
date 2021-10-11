const express = require("express");
const router = express.Router();
const model = require("../models");
const {
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
} = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const { digitize, checkOrderStatusAndUpdate } = require("../services/common.services");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const { DISPATCH_ORDER } = require("../enums");

/* GET productOutwards listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search)
    where[Op.or] = [
      "$DispatchOrder.Inventory.Company.name$",
      "$DispatchOrder.Inventory.Warehouse.name$",
      "$DispatchOrder.internalIdForBusiness$",
      // "$Inventories->Product.name$"
    ].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));
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
    ],
    order: [["updatedAt", "DESC"]],
    where,
    limit,
    offset,
    distinct: true,
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

/* POST create new productOutward. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New productOutward registered";
  let dispatchOrder = await DispatchOrder.findByPk(req.body.dispatchOrderId, { include: [ProductOutward] });
  if (!dispatchOrder)
    return res.json({
      success: false,
      message: "No dispatch order found",
    });
  req.body.inventories = req.body.inventories || [{ id: req.body.inventoryId, quantity: req.body.quantity }];

  try {
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
      req.body.inventories.forEach((Inventory) => {
        let quantity = parseInt(Inventory.quantity);
        sumOfOutwards.push(quantity);
      });
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
    console.log("err", err);
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
    attributes: ["id", "internalIdForBusiness", "referenceId", "shipmentDate", "receiverName", "receiverPhone"],
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

module.exports = router;
