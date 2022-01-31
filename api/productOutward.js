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
  InventoryDetail,
  OutwardGroupBatch,
} = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const {
  digitize,
  checkOrderStatusAndUpdate,
  checkForMatchInArray,
} = require("../services/common.services");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const { DISPATCH_ORDER } = require("../enums");
const Joi = require("joi");
const httpStatus = require("http-status");
const ExcelJS = require("exceljs");
const authService = require("../services/auth.service");
const moment = require("moment-timezone");
const { findAll } = require("../dao/AdjustmentInventory");
const inventory = require("../models/inventory");

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
      batches: Joi.array().items(
        Joi.object({
          inventoryDetailId: Joi.number().integer().required(),
          quantity: Joi.number().integer().required(),
          availableQuantity: Joi.number().integer().required(),
        })
      ),
    })
  ),
  internalIdForBusiness: Joi.required(),
});

router.get("/revert-duplicate-po", async (req, res, next) => {
  try {
    //get duplicated records in ProductOutwards table
    const response = await sequelize.query(
      `
          select
          po.quantity ,
          po.dispatchOrderId ,
          po.userId,
          po.referenceId ,
          po.vehicleId ,
          po.externalVehicle,
          count(po.id),
          GROUP_CONCAT(po.id) as outwardList
        from
          ProductOutwards po
        group by
          po.quantity ,
          po.dispatchOrderId ,
          po.userId,
          po.referenceId ,
          po.vehicleId ,
          po.externalVehicle
        having count(po.id) > 1
        order by count(po.id)
    `,
      { type: sequelize.QueryTypes.SELECT }
    );

    const duplicateOutwardList = [];
    console.time("loop time");

    //get duplicate OrderGroups of duplicat2 ProductOutwards
    for (const item of response) {
      const outwards = item.outwardList.split(",").sort((a, b) => a - b);
      const ogList = [];
      let count = 0;
      for (const id of outwards) {
        let createdTime = (
          await ProductOutward.findOne({
            where: {
              id: outwards[count + 1]
                ? outwards[count + 1]
                : outwards[count - 1],
            },
            attributes: ["createdAt"],
          })
        ).createdAt;
        count++;
        const ogs = await OutwardGroup.findAll({
          where: {
            outwardId: id,
            "$ProductOutward.deletedAt$": null,
            // "$ProductOutward.createdAt$": {
            //   [Op.between]: [
            //     moment(createdTime)
            //       .utc()
            //       .subtract(60, "seconds")
            //       .format("YYYY-MM-DD hh:mm:ss"),
            //     moment(createdTime)
            //       .utc()
            //       .add(60, "seconds")
            //       .format("YYYY-MM-DD hh:mm:ss"),
            //   ],
            // },
          },
          attributes: [
            "quantity",
            "availableQuantity",
            "userId",
            "inventoryId",
          ],
          include: [{ model: ProductOutward, required: true, attributes: [] }],
        }).then((r) => JSON.parse(JSON.stringify(r)));

        ogList.push(ogs);
      }

      for (let i = 0; i < ogList.length; i++) {
        if (i < ogList.length - 1) {
          if (JSON.stringify(ogList[i]) == JSON.stringify(ogList[i + 1])) {
            duplicateOutwardList.push(outwards[i + 1]);
          }
        }
      }
    }

    const duplicates = await ProductOutward.findAll({
      where: { id: { [Op.in]: duplicateOutwardList } },
      attributes: ["id", "dispatchOrderId"],
    });

    const revertOutwards = [];
    await Promise.all(
      duplicates.map(async (record) => {
        // for (const record of duplicates) {
        const Do = await DispatchOrder.findOne({
          where: { id: record.dispatchOrderId },
          include: [{ model: OrderGroup, as: "OrderGroups" }],
        });

        const totalDoQty = Do.OrderGroups.reduce((total, current) => {
          return total + current.quantity;
        }, 0);

        const outwards = await ProductOutward.findAll({
          where: { dispatchOrderId: Do.id },
          include: [{ model: OutwardGroup }],
        });

        let totalPoQty = 0;
        for (const out of outwards) {
          totalPoQty = out.OutwardGroups.reduce((total, current) => {
            return total + current.quantity;
          }, totalPoQty);
        }
        if (totalDoQty < totalPoQty) {
          await revertOutward(record, revertOutwards);
        }
      })
    );

    console.timeEnd("loop time");
    res.json({ revertOutwards });
  } catch (err) {
    console.log("err", err);

    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

const revertOutward = async (outward, revertOutwards) => {
  revertOutwards.push(outward.id);
  outward.OutwardGroups = await outward.getOutwardGroups();
  for (const og of outward.OutwardGroups) {
    const inv = await Inventory.findOne({ where: { id: og.inventoryId } });
    inv.committedQuantity = inv.committedQuantity + og.quantity;
    inv.dispatchedQuantity = inv.dispatchedQuantity - og.quantity;
    await inv.save();
  }
  await ProductOutward.destroy({ where: { id: outward.id } });
  await OutwardGroup.destroy({ where: { outwardId: outward.id } });
};

router.get("/revert-duplicate-po2", async (req, res, next) => {
  try {
    //get duplicated records in ProductOutwards table
    const response = await sequelize.query(
      `
          select
          po.quantity ,
          po.dispatchOrderId ,
          po.userId,
          po.referenceId ,
          po.vehicleId ,
          po.externalVehicle,
          count(po.id),
          GROUP_CONCAT(po.id) as outwardList
        from
          ProductOutwards po
        group by
          po.quantity ,
          po.dispatchOrderId ,
          po.userId,
          po.referenceId ,
          po.vehicleId ,
          po.externalVehicle
        having count(po.id) > 1
        order by count(po.id)
    `,
      { type: sequelize.QueryTypes.SELECT }
    );

    const duplicateOutwardList = [];

    //get duplicate OrderGroups of duplicate ProductOutwards
    for (const item of response) {
      const outwards = item.outwardList.split(",");
      let createdTime = await ProductOutward.findOne({
        where: { id: outwards[0] },
        attributes: ["createdAt"],
      });

      if (createdTime) {
        createdTime = createdTime.createdAt;
      }

      const ogList = [];
      for (const id of outwards) {
        const ogs = await OutwardGroup.findAll({
          where: {
            outwardId: id,
            "$ProductOutward.deletedAt$": null,
            "$ProductOutward.createdAt$": {
              [Op.between]: [
                moment(createdTime)
                  .utc()
                  .subtract(30, "seconds")
                  .format("YYYY-MM-DD hh:mm:ss"),
                moment(createdTime)
                  .utc()
                  .add(30, "seconds")
                  .format("YYYY-MM-DD hh:mm:ss"),
              ],
            },
          },
          attributes: [
            "quantity",
            "availableQuantity",
            "userId",
            "inventoryId",
          ],
          include: [{ model: ProductOutward, required: true, attributes: [] }],
        }).then((r) => JSON.parse(JSON.stringify(r)));

        ogList.push(ogs);
      }

      for (let i = 0; i < ogList.length; i++) {
        if (i < ogList.length - 1) {
          if (JSON.stringify(ogList[i]) == JSON.stringify(ogList[i + 1])) {
            const out1 = await ProductOutward.findOne({
              where: { id: outwards[i], deletedAt: null },
              attributes: ["id"],
            });
            const out2 = await ProductOutward.findOne({
              where: { id: outwards[i + 1], deletedAt: null },
              attributes: ["id"],
            });
            if (out1 && out2) {
              duplicateOutwardList.push(outwards[i + 1]);
            }
          }
        }
      }
    }

    const revertOutwards = [];
    const outwards = await ProductOutward.findAll({
      where: { id: { [Op.in]: duplicateOutwardList } },
    });

    for (let i = 0; i < outwards.length; i++) {
      revertOutward(outwards[i], revertOutwards);
    }

    let duplicatedRecords = [];
    // for (const poId of duplicateOutwardList) {
    //   const outward = await ProductOutward.findOne({
    //     where: { id: poId },
    //     attributes: ["id", "dispatchOrderId"],
    //   });
    //   const Do = (
    //     await DispatchOrder.findAll({
    //       where: { id: outward.dispatchOrderId },
    //       include: [{ model: OrderGroup, as: "OrderGroups" }],
    //     })
    //   )[0];

    //   if (Do) {
    //     const totalDoQty = Do.OrderGroups.reduce((total, current) => {
    //       return total + current.quantity;
    //     }, 0);

    //     const outwards = await ProductOutward.findAll({
    //       where: { dispatchOrderId: Do.id },
    //       include: [{ model: OutwardGroup }],
    //     });

    //     let totalPoQty = 0;
    //     let count = 0;
    //     for (const out of outwards) {
    //       totalPoQty = out.OutwardGroups.reduce((total, current) => {
    //         return total + current.quantity;
    //       }, totalPoQty);
    //       if (totalDoQty == totalPoQty) {
    //         break;
    //       } else if (totalDoQty < totalPoQty) {
    //         break;
    //       }
    //       count++;
    //     }

    //     for (let i = count + 1; i < outwards.length; i++) {
    //       revertOutward(outwards[i], revertOutwards);
    //     }
    //   }
    // }

    console.timeEnd("loop time");
    res.json({ revertOutwards });
  } catch (err) {
    console.log("err", err);

    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

router.get("/duplicated-po", async (req, res, next) => {
  try {
    //get duplicated records in ProductOutwards table
    const response = await sequelize.query(
      `
          select
          po.quantity ,
          po.dispatchOrderId ,
          po.userId,
          po.referenceId ,
          po.vehicleId ,
          po.externalVehicle,
          count(po.id),
          GROUP_CONCAT(po.id) as outwardList
        from
          ProductOutwards po
        group by
          po.quantity ,
          po.dispatchOrderId ,
          po.userId,
          po.referenceId ,
          po.vehicleId ,
          po.externalVehicle
        having count(po.id) > 1
        order by count(po.id)
    `,
      { type: sequelize.QueryTypes.SELECT }
    );

    const duplicateOutwardList = [];

    //get duplicate OrderGroups of duplicate ProductOutwards
    for (const item of response) {
      const outwards = item.outwardList.split(",");
      ``;
      let createdTime = await ProductOutward.findOne({
        where: { id: outwards[0] },
        attributes: ["createdAt"],
      });

      if (createdTime) {
        createdTime = createdTime.createdAt;
      }

      const ogList = [];
      for (const id of outwards) {
        const ogs = await OutwardGroup.findAll({
          where: {
            outwardId: id,
            "$ProductOutward.deletedAt$": null,
            "$ProductOutward.createdAt$": {
              [Op.between]: [
                moment(createdTime)
                  .utc()
                  .subtract(30, "seconds")
                  .format("YYYY-MM-DD hh:mm:ss"),
                moment(createdTime)
                  .utc()
                  .add(30, "seconds")
                  .format("YYYY-MM-DD hh:mm:ss"),
              ],
            },
          },
          attributes: [
            "quantity",
            "availableQuantity",
            "userId",
            "inventoryId",
          ],
          include: [{ model: ProductOutward, required: true, attributes: [] }],
        }).then((r) => JSON.parse(JSON.stringify(r)));

        ogList.push(ogs);
      }

      for (let i = 0; i < ogList.length; i++) {
        if (i < ogList.length - 1) {
          if (JSON.stringify(ogList[i]) == JSON.stringify(ogList[i + 1])) {
            duplicateOutwardList.push({
              do: item.dispatchOrderId,
              po: outwards[i],
            });
            duplicateOutwardList.push({
              do: item.dispatchOrderId,
              po: outwards[i + 1],
            });
          }
        }
      }
    }

    let duplicatedRecords = [];
    let duplicatedDos = [];
    for (const obj of duplicateOutwardList) {
      const Do = (
        await DispatchOrder.findAll({
          where: { id: obj.do },
          include: [{ model: OrderGroup, as: "OrderGroups" }],
        })
      )[0];

      const totalDoQty = Do.OrderGroups.reduce((total, current) => {
        return total + current.quantity;
      }, 0);

      const outwards = await ProductOutward.findAll({
        where: { dispatchOrderId: Do.id },
        include: [{ model: OutwardGroup, attributes: ["id", "quantity"] }],
        attributes: ["id", "createdAt", "deletedAt"],
      });

      let totalPoQty = 0;
      for (const out of outwards) {
        totalPoQty = out.OutwardGroups.reduce((total, current) => {
          return total + current.quantity;
        }, totalPoQty);
      }
      if (totalDoQty < totalPoQty) {
        // duplicatedRecords.push({
        //   Do: { id: Do.id, qty: totalDoQty },
        //   Po: { outwards, totalPoQty },
        // });
        duplicatedDos.push(Do.id);
      }
    }

    duplicatedDos = [...new Set(duplicatedDos)];
    duplicatedRecords = await Promise.all(
      duplicatedDos.map(async (id) => {
        const po = await ProductOutward.findAll({
          where: { dispatchOrderId: id },
          include: [{ model: OutwardGroup, attributes: ["id", "quantity"] }],
          attributes: ["id", "createdAt", "deletedAt"],
        });
        return { Do: id, outwards: po };
      })
    );

    console.timeEnd("loop time");
    res.json({ duplicatedDos, duplicatedRecords });
  } catch (err) {
    console.log("err", err);

    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

router.get("/check-do", async (req, res, next) => {
  try {
    const orders = await DispatchOrder.findAll({
      include: [
        {
          model: OrderGroup,
          as: "OrderGroups",
          attributes: ["id", "quantity"],
        },
        {
          model: ProductOutward,
          include: [
            {
              model: OutwardGroup,
              as: "OutwardGroups",
              attributes: ["id", "quantity"],
            },
          ],
          attributes: ["id"],
        },
      ],
      attributes: ["id"],
    });

    const revertOutwards = [];
    const duplicatedDos = [];
    // for (const Do of orders) {
    await Promise.all(
      orders.map(async (Do) => {
        const totalDoQty = Do.OrderGroups.reduce((total, current) => {
          return total + current.quantity;
        }, 0);

        const outwards = await ProductOutward.findAll({
          where: { dispatchOrderId: Do.id },
          include: [{ model: OutwardGroup, attributes: ["id", "quantity"] }],
          attributes: ["id", "createdAt", "deletedAt"],
        });

        let totalPoQty = 0;
        for (const out of outwards) {
          totalPoQty = out.OutwardGroups.reduce((total, current) => {
            return total + current.quantity;
          }, totalPoQty);
        }

        if (totalDoQty < totalPoQty) {
          duplicatedDos.push(Do.id);
        }
      })
    );

    // }

    res.json({ duplicatedDos });
  } catch (err) {
    console.log("err", err);

    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

router.get("/fix-do", async (req, res, next) => {
  try {
    const orders = await DispatchOrder.findAll({
      include: [
        {
          model: OrderGroup,
          as: "OrderGroups",
          attributes: ["id", "quantity"],
        },
        {
          model: ProductOutward,
          include: [
            {
              model: OutwardGroup,
              as: "OutwardGroups",
              attributes: ["id", "quantity"],
            },
          ],
          attributes: ["id"],
        },
      ],
      attributes: ["id"],
    });

    const revertOutwards = [];
    const duplicatedDos = [];
    // for (const Do of orders) {
    await Promise.all(
      orders.map(async (Do) => {
        const totalDoQty = Do.OrderGroups.reduce((total, current) => {
          return total + current.quantity;
        }, 0);

        const outwards = await ProductOutward.findAll({
          where: { dispatchOrderId: Do.id },
          include: [{ model: OutwardGroup, attributes: ["id", "quantity"] }],
          attributes: ["id", "createdAt", "deletedAt"],
        });

        let totalPoQty = 0;
        for (const out of outwards) {
          totalPoQty = out.OutwardGroups.reduce((total, current) => {
            return total + current.quantity;
          }, totalPoQty);
          if (totalDoQty < totalPoQty) {
            revertOutward(out, revertOutwards);
          }
        }

        if (totalDoQty < totalPoQty) {
          duplicatedDos.push(Do.id);
        }
      })
    );

    // }

    res.json({ revertOutwards });
  } catch (err) {
    console.log("err", err);

    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

router.get("/doubtful-po", async (req, res, next) => {
  try {
    //get duplicated records in ProductOutwards table
    const response = await sequelize.query(
      `
          select
          po.quantity ,
          po.dispatchOrderId ,
          po.userId,
          po.referenceId ,
          po.vehicleId ,
          po.externalVehicle,
          count(po.id),
          GROUP_CONCAT(po.id) as outwardList
        from
          ProductOutwards po
        group by
          po.quantity ,
          po.dispatchOrderId ,
          po.userId,
          po.referenceId ,
          po.vehicleId ,
          po.externalVehicle
        having count(po.id) > 1
        order by count(po.id)
    `,
      { type: sequelize.QueryTypes.SELECT }
    );

    const duplicateOutwardList = [];
    //get duplicate OrderGroups of duplicat ProductOutwards
    for (const item of response) {
      const outwards = item.outwardList.split(",");
      ``;
      let createdTime = await ProductOutward.findOne({
        where: { id: outwards[0] },
        attributes: ["createdAt"],
      });

      if (createdTime) {
        createdTime = createdTime.createdAt;
      }

      const ogList = [];
      for (const id of outwards) {
        const ogs = await OutwardGroup.findAll({
          where: {
            outwardId: id,
            "$ProductOutward.createdAt$": {
              [Op.between]: [
                moment(createdTime)
                  .utc()
                  .subtract(30, "seconds")
                  .format("YYYY-MM-DD hh:mm:ss"),
                moment(createdTime)
                  .utc()
                  .add(30, "seconds")
                  .format("YYYY-MM-DD hh:mm:ss"),
              ],
            },
          },
          attributes: [
            "quantity",
            "availableQuantity",
            "userId",
            "inventoryId",
          ],
          include: [{ model: ProductOutward, required: true, attributes: [] }],
        }).then((r) => JSON.parse(JSON.stringify(r)));

        ogList.push(ogs);
      }

      for (let i = 0; i < ogList.length; i++) {
        if (i < ogList.length - 1) {
          if (JSON.stringify(ogList[i]) == JSON.stringify(ogList[i + 1])) {
            duplicateOutwardList.push({
              do: item.dispatchOrderId,
              po: outwards[i],
            });
            duplicateOutwardList.push({
              do: item.dispatchOrderId,
              po: outwards[i + 1],
            });
          }
        }
      }
    }

    let consolidatedOutwards = [];
    for (const item of duplicateOutwardList) {
      if (checkForMatchInArray(consolidatedOutwards, "do", item.do)) {
        const obj = consolidatedOutwards.filter((i) => i.do === item.do)[0];
        obj.po.push(item.po);
      } else {
        consolidatedOutwards.push({ do: item.do, po: [item.po] });
      }
    }

    consolidatedOutwards = await Promise.all(
      consolidatedOutwards.map(async (obj) => {
        let flag = true;
        obj.po = await Promise.all(
          obj.po.map(async (outwardId) => {
            _outward = await ProductOutward.findOne({
              where: { id: outwardId },
              attributes: ["id", "createdAt"],
            });
            if (!_outward) {
              flag = false;
            }
            outwardId = _outward;
            return outwardId;
          })
        );
        if (flag === true) return obj;
      })
    );

    consolidatedOutwards = consolidatedOutwards.filter((a) => {
      return a != null;
    });

    console.timeEnd("loop time");
    res.json({ consolidatedOutwards, duplicateOutwardList });
  } catch (err) {
    console.log("err", err);

    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

router.get("/do-status", async (req, res, next) => {
  try {
    const orders = await DispatchOrder.findAll({
      include: [{ model: OrderGroup, as: "OrderGroups" }],
    });
    console.time();
    const DOs = [];
    // for (const Do of orders) {
    await Promise.all(
      orders.map(async (Do) => {
        const totalDoQty = Do.OrderGroups.reduce((total, current) => {
          return total + current.quantity;
        }, 0);

        const outwards = await ProductOutward.findAll({
          where: { dispatchOrderId: Do.id },
          include: [{ model: OutwardGroup, attributes: ["quantity"] }],
        });

        let totalPoQty = 0;
        for (const out of outwards) {
          totalPoQty = out.OutwardGroups.reduce((total, current) => {
            return total + current.quantity;
          }, totalPoQty);
        }
        if (totalDoQty == totalPoQty || totalDoQty < totalPoQty) {
          // Do.status = DISPATCH_ORDER.STATUS.FULFILLED;
          if (Do.status != DISPATCH_ORDER.STATUS.FULFILLED)
            DOs.push({ id: Do.id, status: DISPATCH_ORDER.STATUS.FULFILLED });
        } else if (totalPoQty == 0) {
          // Do.status = DISPATCH_ORDER.STATUS.PENDING;
          if (Do.status != DISPATCH_ORDER.STATUS.PENDING)
            DOs.push({ id: Do.id, status: DISPATCH_ORDER.STATUS.PENDING });
        } else if (totalPoQty > 0 && totalPoQty < totalDoQty) {
          // Do.status = DISPATCH_ORDER.STATUS.PARTIALLY_FULFILLED;
          if (Do.status != DISPATCH_ORDER.STATUS.PARTIALLY_FULFILLED)
            DOs.push({
              id: Do.id,
              status: DISPATCH_ORDER.STATUS.PARTIALLY_FULFILLED,
            });
        }
        // await Do.save();
      })
    );
    console.timeEnd();

    console.time();
    for (const order of DOs) {
      await DispatchOrder.update(
        { status: order.status },
        { where: { id: order.id } }
      );
    }
    console.timeEnd();
    // }
    res.sendJson(DOs, "orders status update", httpStatus.OK);
  } catch (err) {
    console.log("err", err);
    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

router.get("/revert-mismatch-po", async (req, res, next) => {
  try {
    console.time();
    const outwards = await ProductOutward.findAll({
      include: [
        { model: OutwardGroup, attributes: ["id", "quantity", "inventoryId"] },
        {
          model: DispatchOrder,
          include: [
            {
              model: OrderGroup,
              as: "OrderGroups",
              attributes: ["id", "quantity", "inventoryId"],
            },
          ],
          attributes: ["id"],
        },
      ],
      attributes: ["id"],
    });

    console.timeEnd();

    const revertOutwardIds = [];

    for (const outward of outwards) {
      const outwardGroupIds = [];
      for (const outwardGroup of outward.OutwardGroups) {
        outwardGroupIds.push(outwardGroup.inventoryId);
      }

      const orderGroupIds = [];
      for (const orderGroup of outward.DispatchOrder.OrderGroups) {
        orderGroupIds.push(orderGroup.inventoryId);
      }

      for (const inventoryId of outwardGroupIds) {
        if (!orderGroupIds.includes(inventoryId)) {
          revertOutwardIds.push(outward.id);
          break;
        }
      }
    }

    const outwardsToRevert = await ProductOutward.findAll({
      where: { id: { [Op.in]: revertOutwardIds } },
    });

    const revertOutwards = [];
    for (let i = 0; i < outwardsToRevert.length; i++) {
      revertOutward(outwardsToRevert[i], revertOutwards);
    }

    res.sendJson(httpStatus.OK, "reverted mismatch po", revertOutwards);
  } catch (err) {
    console.log("err", err);
    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

router.get("/mismatch-po", async (req, res, next) => {
  try {
    console.time();
    const outwards = await ProductOutward.findAll({
      include: [
        { model: OutwardGroup, attributes: ["id", "quantity", "inventoryId"] },
        {
          model: DispatchOrder,
          include: [
            {
              model: OrderGroup,
              as: "OrderGroups",
              attributes: ["id", "quantity", "inventoryId"],
            },
          ],
          attributes: ["id"],
        },
      ],
      attributes: ["id"],
    });

    console.timeEnd();

    const revertOutwardIds = [];

    for (const outward of outwards) {
      const outwardGroupIds = [];
      for (const outwardGroup of outward.OutwardGroups) {
        outwardGroupIds.push(outwardGroup.inventoryId);
      }

      const orderGroupIds = [];
      for (const orderGroup of outward.DispatchOrder.OrderGroups) {
        orderGroupIds.push(orderGroup.inventoryId);
      }

      for (const inventoryId of outwardGroupIds) {
        if (!orderGroupIds.includes(inventoryId)) {
          revertOutwardIds.push(outward.id);
          break;
        }
      }
    }

    const outwardsToRevert = await ProductOutward.findAll({
      where: { id: { [Op.in]: revertOutwardIds } },
      attributes: ["id", "dispatchOrderId"],
      include: [
        {
          model: Inventory,
          as: "Inventories",
          required: true,
          include: [{ model: Product, as: "Product", attributes: ["name"] }],
          attributes: ["id"],
        },
      ],
    });

    // const revertOutwards = [];
    // for (let i = 0; i < outwardsToRevert.length; i++) {
    //   revertOutward(outwardsToRevert[i], revertOutwards);
    // }

    res.sendJson(httpStatus.OK, "reverted mismatch po", outwardsToRevert);
  } catch (err) {
    console.log("err", err);
    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

router.get("/test", async (req, res, next) => {
  try {
    const doIds = [26290, 26664, 26485, 26466];
    const outwards = await ProductOutward.findAll({
      where: { dispatchOrderId: { [Op.in]: doIds } },
    });
    const revertOutwards = [];
    for (let i = 0; i < outwards.length; i++) {
      revertOutward(outwards[i], revertOutwards);
    }

    res.json(revertOutwards);
  } catch (err) {
    console.log("err", err);
    res.sendError(httpStatus.CONFLICT, err.message);
  }
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
            include: [
              { model: Product, include: [{ model: UOM }] },
              { model: Company },
              { model: Warehouse },
            ],
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

  for (const outward of response.rows) {
    for (const inv of outward.Inventories) {
      const detail = await InventoryDetail.findAll({
        include: [
          {
            model: OutwardGroup,
            as: "OutwardGroup",
            through: OutwardGroupBatch,
          },
        ],
        where: { "$OutwardGroup.id$": { [Op.eq]: inv.OutwardGroup.id } },
        logging: true,
      });
      inv.OutwardGroup.dataValues.InventoryDetail = detail;
    }
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
    columns.map((column) => ({
      header: column,
      width: Math.ceil(column.length * 1.5),
      outlineLevel: 1,
    }));

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
    // "BATCH ENABLED",
    "BATCH QUANTITY",
    "BATCH NUMBER",
    "MANUFACTURING DATE",
    "EXPIRY DATE",
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
            as: "Inventory",
            include: [
              { model: Product, include: [{ model: UOM }] },
              { model: Company },
              { model: Warehouse },
            ],
          },
          {
            model: Inventory,
            as: "Inventories",
            include: [
              { model: Product, include: [{ model: UOM }] },
              { model: Company },
              { model: Warehouse },
            ],
            required: true,
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
  });

  var acc = [];
  response.forEach((productOutward) => {
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
    response[index].DispatchOrder.quantity = acc[index];
  }

  var comittedAcc = [];
  response.forEach((productOutward) => {
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
    response[index].quantity = comittedAcc[index];
  }

  for (const outward of response) {
    for (const inv of outward.Inventories) {
      const detail = await InventoryDetail.findAll({
        include: [
          {
            model: OutwardGroup,
            as: "OutwardGroup",
            through: OutwardGroupBatch,
          },
        ],
        where: { "$OutwardGroup.id$": { [Op.eq]: inv.OutwardGroup.id } },
      });
      inv.OutwardGroup.dataValues.InventoryDetail = detail;
    }
  }

  const outwardArray = [];
  for (const outward of response) {
    for (const inv of outward.DispatchOrder.Inventories) {
      const OG = await OrderGroup.findOne({
        where: { inventoryId: inv.id, orderId: outward.DispatchOrder.id },
      });
      const OutG = await OutwardGroup.findOne({
        where: { inventoryId: inv.id, outwardId: outward.id },
      });
      if (inv.Product.batchEnabled) {
        var outwardInv = outward.Inventories.find((inv) => inv.id == inv.id);
        if (!!outwardInv) {
          for (let invDetail of outwardInv.OutwardGroup.dataValues
            .InventoryDetail) {
            var outwardQuantity =
              invDetail.OutwardGroup.find(
                (outGroup) => outGroup.inventoryId == invDetail.inventoryId
              ).OutwardGroupBatch.quantity || "";
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
              OG.quantity || 0,
              OutG ? OutG.quantity || 0 : "Not available",
              // OutG.quantity || 0,
              moment(outward.DispatchOrder.shipmentDate).format(
                "DD/MM/yy HH:mm"
              ),
              moment(outward.createdAt)
                .tz(req.query.client_Tz)
                .format("DD/MM/yy HH:mm"),
              outward.externalVehicle ? "Customer Provided" : "Oware Provided",
              outwardQuantity || "",
              invDetail.batchNumber || "",
              invDetail.manufacturingDate
                ? moment(invDetail.manufacturingDate)
                    .tz(req.query.client_Tz)
                    .format("DD/MM/yy")
                : "",
              invDetail.expiryDate
                ? moment(invDetail.expiryDate)
                    .tz(req.query.client_Tz)
                    .format("DD/MM/yy")
                : "",
            ]);
          }
        }
      } else {
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
          OG.quantity || 0,
          OutG ? OutG.quantity || 0 : "Not available",
          // OutG.quantity || 0,
          moment(outward.DispatchOrder.shipmentDate).format("DD/MM/yy HH:mm"),
          moment(outward.createdAt)
            .tz(req.query.client_Tz)
            .format("DD/MM/yy HH:mm"),
          outward.externalVehicle ? "Customer Provided" : "Oware Provided",
          "",
          "",
          "",
          "",
        ]);
      }
    }
  }

  worksheet.addRows(outwardArray);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + "Inventory.xlsx"
  );

  await workbook.xlsx.write(res).then(() => res.end());
});

/* POST create new productOutward. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New productOutward registered";
  let dispatchOrder = await DispatchOrder.findByPk(req.body.dispatchOrderId, {
    include: [ProductOutward],
  });
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
  req.body.inventories = req.body.inventories || [
    { id: req.body.inventoryId, quantity: req.body.quantity },
  ];

  try {
    const isValid = await BulkAddValidation.validateAsync(req.body);
    if (isValid) {
      let productOutward;
      const outwardGroupBatch = [];
      await sequelize.transaction(async (transaction) => {
        productOutward = await ProductOutward.create(
          {
            userId: req.userId,
            ...req.body,
          },
          { transaction }
        );
        const numberOfInternalIdForBusiness = digitize(productOutward.id, 6);
        productOutward.internalIdForBusiness =
          req.body.internalIdForBusiness + numberOfInternalIdForBusiness;
        let sumOfOutwards = [];
        let outwardAcc;
        for (const Inventory of req.body.inventories) {
          const OG = await OrderGroup.findOne({
            where: {
              orderId: req.body.dispatchOrderId,
              inventoryId: Inventory.id,
            },
          });
          if (!OG) {
            throw new Error(
              "Cannot create outward having products other than ordered products"
            );
          }

          const outwards = await ProductOutward.findAll({
            where: {
              dispatchOrderId: req.body.dispatchOrderId,
              "$OutwardGroups.inventoryId$": Inventory.id,
            },
            include: [{ model: OutwardGroup, attributes: ["id", "quantity"] }],
            attributes: ["id", "createdAt", "deletedAt"],
          });

          let totalPoQty = 0;
          for (const out of outwards) {
            totalPoQty = out.OutwardGroups.reduce((total, current) => {
              return total + current.quantity;
            }, totalPoQty);
          }

          if (Inventory.quantity > OG.quantity - totalPoQty) {
            throw new Error(
              "Outward quantity cant be greater than dispatch order quantity"
            );
          }
          let quantity = parseInt(Inventory.quantity);
          sumOfOutwards.push(quantity);
        }
        outwardAcc = sumOfOutwards.reduce((acc, po) => {
          return acc + po;
        });
        productOutward.quantity = outwardAcc;
        await productOutward.save({ transaction });

        const outwardGroups = await OutwardGroup.bulkCreate(
          req.body.inventories.map((inventory) => ({
            userId: req.userId,
            outwardId: productOutward.id,
            inventoryId: inventory.id,
            quantity: inventory.quantity,
            availableQuantity: inventory.availableQuantity,
          })),
          { transaction }
        );

        await checkOrderStatusAndUpdate(
          model,
          req.body.dispatchOrderId,
          productOutward.quantity,
          transaction
        );

        return Promise.all(
          req.body.inventories.map((_inventory) => {
            return Inventory.findByPk(_inventory.id, { transaction }).then(
              (inventory) => {
                if (!inventory && !_inventory.id)
                  throw new Error("Inventory is not available");
                if (_inventory.quantity > inventory.committedQuantity)
                  throw new Error(
                    "Cannot create orders above available quantity"
                  );
                try {
                  _inventory.batches.map(async (_batch) => {
                    InventoryDetail.findOne(
                      {
                        where: {
                          id: _batch.inventoryDetailId,
                        },
                      },

                      { transaction }
                    ).then((batch) => {
                      batch.outwardQuantity =
                        batch.outwardQuantity + _batch.quantity;
                      batch.availableQuantity =
                        batch.availableQuantity - _batch.quantity;
                      batch.save({ transaction });
                    });
                  });
                  inventory.dispatchedQuantity += +_inventory.quantity;
                  inventory.committedQuantity -= +_inventory.quantity;
                  return inventory.save({ transaction });
                } catch (err) {
                  console.log("err", err);
                  transaction.rollback();
                  throw new Error(err.errors.pop().message);
                }
              }
            );
          })
        );
      });

      let group;
      for (const inv of req.body.inventories) {
        group = await OutwardGroup.findOne({
          where: {
            inventoryId: inv.id,
            outwardId: productOutward.id,
          },
        });
        for (const b of inv.batches) {
          await OutwardGroupBatch.create({
            outwardGroupId: group.id,
            inventoryDetailId: b.inventoryDetailId,
            quantity: b.quantity,
          });
        }
      }

      return res.json({
        success: true,
        message,
        data: productOutward,
      });
    } else {
      return res.sendError(
        httpStatus.UNPROCESSABLE_ENTITY,
        isValid,
        "Unable to add outward"
      );
    }
  } catch (err) {
    console.log("err", err);
    return res.json({
      success: false,
      message: err.toString().replace("Error: ", ""),
    });
  }
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
    attributes: ["id", "internalIdForBusiness"],
    where: {
      status: {
        [Op.notIn]: [
          DISPATCH_ORDER.STATUS.FULFILLED,
          DISPATCH_ORDER.STATUS.CANCELLED,
        ],
      },
    },
    // group: ["id"],
    order: [["updatedAt", "DESC"]],
  });

  const vehicles = await Vehicle.findAll({
    where: { isActive: true },
    attributes: ["id", "registrationNumber"],
  });

  res.json({
    success: true,
    message: "respond with a resource",
    dispatchOrders,
    vehicles,
  });
});

router.get("/batch", async (req, res) => {
  try {
    const batches = await InventoryDetail.findAll({
      include: [{ model: Inventory, as: "Inventory", attributes: [] }],
      order: [["expiryDate", "ASC"]],
    });

    res.sendJson(batches, "get batches", httpStatus.OK);
  } catch (err) {
    res.sendError(httpStatus.CONFLICT, err.message);
  }
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
            include: [
              { model: Product, include: [{ model: UOM }] },
              { model: Company },
              { model: Warehouse },
            ],
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

  // for (const outward of response.rows) {
  for (const inv of productOutward.Inventories) {
    const detail = await InventoryDetail.findAll({
      include: [
        {
          model: OutwardGroup,
          as: "OutwardGroup",
          through: OutwardGroupBatch,
        },
      ],
      where: { "$OutwardGroup.id$": { [Op.eq]: inv.OutwardGroup.id } },
    });
    inv.OutwardGroup.dataValues.InventoryDetail = detail;
  }
  // }

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
