const express = require("express");
const router = express.Router();
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
  sequelize
} = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const {
  digitize,
  removeFromObject,
  sanitizeFilters,
  removeChildModelFilters,
  attachDateFilter,
  modelWiseFilters
} = require("../services/common.services");

/* GET productOutwards listing. */
router.get("/", async (req, res, next) => {
  try {
    const { rowsPerPage, page, ...filters } = req.query;
    const limit = page ? Number(rowsPerPage || config.rowsPerPage) : 1000;
    const offset = Number((page - 1 || 0) * limit);
    where = sanitizeFilters({ ...filters });
    console.log(`modelWiseFilters(where, "Warehouse")`, modelWiseFilters(where, "Warehouse"));
    const response = await ProductOutward.findAndCountAll({
      duplicating: false,
      include: [
        {
          duplicating: false,
          model: DispatchOrder,
          include: [
            {
              model: Inventory,
              as: "Inventory",
              include: [
                { model: Product, include: [{ model: UOM }] },
                { model: Company, where: modelWiseFilters(where, "Company"), required: true, distinct: true },
                { model: Warehouse, where: modelWiseFilters(where, "Warehouse"), required: true }
              ]
            },
            {
              model: Inventory,
              as: "Inventories",
              include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
            }
          ],
          where: modelWiseFilters(where, "DispatchOrder")
        },
        {
          model: Vehicle,
          include: [{ model: Car, include: [CarMake, CarModel] }]
        },
        {
          model: Inventory,
          as: "Inventories",
          include: [
            { model: Product, include: [{ model: UOM }], where: modelWiseFilters(where, "Product"), required: true },
            { model: Company },
            { model: Warehouse }
          ]
        }
      ],
      order: [["updatedAt", "DESC"]],
      where: removeChildModelFilters({ ...where }),
      distinct: true,
      limit,
      offset
    });
    var acc = [];
    response.rows.forEach(productOutward => {
      var sum = [];
      productOutward.DispatchOrder.Inventories.forEach(Inventory => {
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
    response.rows.forEach(productOutward => {
      var sumOfComitted = [];
      productOutward.Inventories.forEach(Inventory => {
        sumOfComitted.push(Inventory.OutwardGroup.quantity);
      });
      if (sumOfComitted.length > 0) {
        comittedAcc.push(
          sumOfComitted.reduce((acc, po) => {
            return acc + po;
          })
        );
      }
    });
    for (let index = 0; index < comittedAcc.length; index++) {
      response.rows[index].quantity = comittedAcc[index];
    }
    console.log("limit", limit, "count", response.count);
    console.log("Math.ceil(response.count / limit)", Math.ceil(response.count / limit));
    res.json({
      success: true,
      message: "respond with a resource",
      data: response.rows,
      pages: Math.ceil(response.count / limit)
    });
  } catch (err) {
    console.log("error", err);
    res.json({
      success: true,
      message: "respond with an error",
      data: null,
      err: err
    });
  }
});

/* POST create new productOutward. */
router.post("/", async (req, res, next) => {
  let message = "New productOutward registered";
  let dispatchOrder = await DispatchOrder.findByPk(req.body.dispatchOrderId, { include: [ProductOutward] });
  if (!dispatchOrder)
    return res.json({
      success: false,
      message: "No dispatch order found"
    });
  req.body.inventories = req.body.inventories || [{ id: req.body.inventoryId, quantity: req.body.quantity }];

  try {
    await sequelize.transaction(async transaction => {
      productOutward = await ProductOutward.create(
        {
          userId: req.userId,
          ...req.body
        },
        { transaction }
      );
      const numberOfInternalIdForBusiness = digitize(productOutward.id, 6);
      productOutward.internalIdForBusiness = req.body.internalIdForBusiness + numberOfInternalIdForBusiness;
      let sumOfOutwards = [];
      let outwardAcc;
      req.body.inventories.forEach(Inventory => {
        let quantity = parseInt(Inventory.quantity);
        sumOfOutwards.push(quantity);
      });
      outwardAcc = sumOfOutwards.reduce((acc, po) => {
        return acc + po;
      });
      productOutward.quantity = outwardAcc;
      await productOutward.save({ transaction });

      await OutwardGroup.bulkCreate(
        req.body.inventories.map(inventory => ({
          userId: req.userId,
          outwardId: productOutward.id,
          inventoryId: inventory.id,
          quantity: inventory.quantity
        })),
        { transaction }
      );

      return Promise.all(
        req.body.inventories.map(_inventory => {
          return Inventory.findByPk(_inventory.id, { transaction }).then(inventory => {
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
      data: productOutward
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
    res.json({
      success: false,
      message: err.toString().replace("Error: ", "")
    });
  }
  res.json({
    success: true,
    message,
    data: productOutward
  });
});

/* PUT update existing productOutward. */
router.put("/:id", async (req, res, next) => {
  let productOutward = await ProductOutward.findOne({
    where: { id: req.params.id },
    include: [{ model: ProductInward }]
  });
  if (!productOutward)
    return res.status(400).json({
      success: false,
      message: "No productOutward found!"
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
      data: response
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message
    });
  }
});

router.delete("/:id", async (req, res, next) => {
  let response = await ProductOutward.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "ProductOutward deleted"
    });
  else
    res.status(400).json({
      success: false,
      message: "No productOutward found!"
    });
});
router.get("/relations", async (req, res, next) => {
  const dispatchOrders = await DispatchOrder.findAll({
    include: [
      {
        model: Inventory,
        as: "Inventory",
        include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
      },
      {
        model: Inventory,
        as: "Inventories",
        include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
      },
      {
        model: ProductOutward,
        include: [
          {
            model: Vehicle
          },
          {
            model: Inventory,
            as: "Inventories",
            include: [{ model: Product, include: [{ model: UOM }] }, { model: Company }, { model: Warehouse }]
          }
        ]
      }
    ],
    order: [["updatedAt", "DESC"]]
  });
  const vehicles = await Vehicle.findAll({ where: { isActive: true } });
  res.json({
    success: true,
    message: "respond with a resource",
    dispatchOrders,
    vehicles
  });
});

module.exports = router;
