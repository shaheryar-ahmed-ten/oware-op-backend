"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");
const { handleHookError } = require("../utility/utility");

module.exports = (sequelize, DataTypes) => {
  class OrderGroup extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OrderGroup.belongsTo(models.User, {
        foreignKey: "userId",
      });
      OrderGroup.belongsTo(models.Inventory, {
        foreignKey: "inventoryId",
      });
      OrderGroup.belongsTo(models.DispatchOrder, {
        foreignKey: "orderId",
      });
    }
  }
  OrderGroup.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      quantity: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: { msg: "Please enter quantity" },
        },
      },
      inventoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Inventory cannot be empty" } },
      },
      orderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Order cannot be empty" } },
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "OrderGroup",
    }
  );

  OrderGroup.addHook('afterBulkCreate', async (data, options) => {
    try {
      const orderGroups = data
      let where = {}, dispatchOrder, inventory
      // object to be saved in table
      if (orderGroups.length) {
        for (let orderGroup of orderGroups) {
          where = {
            id: orderGroup.orderId // because each orderGroup will have same orderId
          }
          // find dispatch order
          dispatchOrder = await sequelize.models.DispatchOrder.findOne({
            where,
            attributes: ["id", "internalIdForBusiness", "status", "orderMemo", "receiverName", "receiverPhone", "shipmentDate", "status", "referenceId", "createdAt"],
            include: [
              {
                model: sequelize.models.User,
                attributes: ["id", "firstName", "lastName"],
              }
            ],
            raw: true,
            transaction: options.transaction
          })
          where = {
            id: orderGroup.inventoryId,
          }
          // find inventory 
          inventory = await sequelize.models.Inventory.findOne({
            where,
            attributes: ["id"],
            include: [
              {
                model: sequelize.models.Company,
                attributes: ["name"]
              },
              {
                model: sequelize.models.Warehouse,
                attributes: ["name"]
              },
              {
                model: sequelize.models.Product,
                attributes: ["name"],
                include: [
                  {
                    model: sequelize.models.UOM,
                    attributes: ["name"]
                  }
                ]
              },
            ],
            raw: true,
            transaction: options.transaction
          })
          // update the summary table
          let newOrderObj = {
            dispatchOrderId: dispatchOrder['internalIdForBusiness'],
            customerName: inventory['Company.name'],
            productName: inventory['Product.name'],
            warehouseName: inventory['Warehouse.name'],
            uom: inventory['Product.UOM.name'],
            receiverName: dispatchOrder['receiverName'],
            receiverPhone: dispatchOrder['receiverPhone'],
            requestedQuantity: orderGroup['quantity'],
            referenceId: dispatchOrder['referenceId'],
            creatorName: `${dispatchOrder['User.firstName']} ${dispatchOrder['User.lastName']}`,
            userId: dispatchOrder['User.id'],
            shipmentDate: dispatchOrder['shipmentDate'],
            status: dispatchOrder['status'],
            orderMemo: dispatchOrder['orderMemo'],
          }
          await sequelize.models.DispatchOrderSummary.create(newOrderObj)
        }
      }
    } catch (error) {
      handleHookError(error, "OrderGroup")
    }
  });

  OrderGroup.addHook('afterCreate', async (data, options) => {
    try {
      const orderGroup = data
      let where = {}, dispatchOrder, inventory

      where = {
        id: orderGroup.orderId
      }

      // find dispatch order
      dispatchOrder = await sequelize.models.DispatchOrder.findOne({
        where,
        attributes: ["id", "internalIdForBusiness", "status", "orderMemo", "receiverName", "receiverPhone", "shipmentDate", "status", "referenceId", "createdAt"],
        include: [
          {
            model: sequelize.models.User,
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        raw: true,
      })

      where = {
        id: orderGroup.inventoryId,
      }
      // find inventory 
      inventory = await sequelize.models.Inventory.findOne({
        where,
        attributes: ["id"],
        include: [
          {
            model: sequelize.models.Company,
            attributes: ["name"]
          },
          {
            model: sequelize.models.Warehouse,
            attributes: ["name"]
          },
          {
            model: sequelize.models.Product,
            attributes: ["name"],
            include: [
              {
                model: sequelize.models.UOM,
                attributes: ["name"]
              }
            ]
          },
        ],
        raw: true,
      })

      // update the summary table
      let newOrderObj = {
        dispatchOrderId: dispatchOrder['internalIdForBusiness'],
        customerName: inventory['Company.name'],
        productName: inventory['Product.name'],
        warehouseName: inventory['Warehouse.name'],
        uom: inventory['Product.UOM.name'],
        receiverName: dispatchOrder['receiverName'],
        receiverPhone: dispatchOrder['receiverPhone'],
        requestedQuantity: orderGroup['quantity'],
        referenceId: dispatchOrder['referenceId'],
        creatorName: `${dispatchOrder['User.firstName']} ${dispatchOrder['User.lastName']}`,
        userId: dispatchOrder['User.id'],
        shipmentDate: dispatchOrder['shipmentDate'],
        status: dispatchOrder['status'],
        orderMemo: dispatchOrder['orderMemo'],
      }
      await sequelize.models.DispatchOrderSummary.create(newOrderObj)
    } catch (error) {
      handleHookError(error, "OrderGroup (After Create)")
    }
  })

  OrderGroup.addHook('afterUpdate', async (data, options) => {
    try {
      let prevOrderGroup = data._previousDataValues;
      let newOrderGroup = data.dataValues;
      let where = {}, dispatchOrder, inventory

      where = {
        id: newOrderGroup.orderId
      }

      // find dispatch order
      dispatchOrder = await sequelize.models.DispatchOrder.findOne({
        where,
        attributes: ["id", "internalIdForBusiness"],
        raw: true,
      })

      where = {
        id: newOrderGroup.inventoryId,
      }
      // find inventory 
      inventory = await sequelize.models.Inventory.findOne({
        where,
        attributes: ["id"],
        include: [
          {
            model: sequelize.models.Company,
            attributes: ["name"]
          },
          {
            model: sequelize.models.Warehouse,
            attributes: ["name"]
          },
          {
            model: sequelize.models.Product,
            attributes: ["name"],
            include: [
              {
                model: sequelize.models.UOM,
                attributes: ["name"]
              }
            ]
          },
        ],
        raw: true,
      })

      where = {
        dispatchOrderId: dispatchOrder['internalIdForBusiness'],
        customerName: inventory['Company.name'],
        productName: inventory['Product.name'],
        warehouseName: inventory['Warehouse.name'],
      }

      // find summary table record
      let summary = await sequelize.models.DispatchOrderSummary.findOne({
        where
      })

      summary.requestedQuantity = newOrderGroup.quantity
      await summary.save()
    } catch (error) {
      handleHookError(error, "OrderGroup (After Create)")
    }
  })


  OrderGroup.addHook('afterDestroy', async (data, options) => {
    try {
      const orderGroup = data
      let where = {}, dispatchOrder, inventory, summary

      where = {
        id: orderGroup.orderId
      }

      // find dispatch order
      dispatchOrder = await sequelize.models.DispatchOrder.findOne({
        where,
        attributes: ["id", "internalIdForBusiness"],
        raw: true,
      })

      where = {
        id: orderGroup.inventoryId,
      }
      // find inventory 
      inventory = await sequelize.models.Inventory.findOne({
        where,
        attributes: ["id"],
        include: [
          {
            model: sequelize.models.Company,
            attributes: ["name"]
          },
          {
            model: sequelize.models.Warehouse,
            attributes: ["name"]
          },
          {
            model: sequelize.models.Product,
            attributes: ["name"],
          },
        ],
        raw: true,
      })

      where = {
        dispatchOrderId: dispatchOrder['internalIdForBusiness'],
        customerName: inventory['Company.name'],
        productName: inventory['Product.name'],
        warehouseName: inventory['Warehouse.name'],
      }
      // find summary table record
      summary = await sequelize.models.DispatchOrderSummary.findOne({
        where
      })
      summary.destroy()
    } catch (error) {
      handleHookError(error, "OrderGroup (After Create)")
    }
  })

  return OrderGroup;
};
