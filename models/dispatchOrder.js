"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");
const {
  DISPATCH_ORDER: { STATUS },
} = require("../enums");
const { handleHookError } = require("../utility/utility");

module.exports = (sequelize, DataTypes) => {
  class DispatchOrder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DispatchOrder.belongsTo(models.User, {
        foreignKey: "userId",
      });
      DispatchOrder.hasMany(models.ProductOutward, {
        foreignKey: "dispatchOrderId",
      });
      DispatchOrder.belongsTo(models.Inventory, {
        foreignKey: "inventoryId",
        as: "Inventory",
      });
      DispatchOrder.belongsToMany(models.Inventory, {
        through: models.OrderGroup,
        foreignKey: "orderId",
        as: "Inventories",
      });
      DispatchOrder.hasMany(models.OrderGroup, {
        foreignKey: "orderId",
        as: "OrderGroups",
      });
    }
  }
  DispatchOrder.init(
    {
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
      internalIdForBusiness: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      referenceId: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      receiverName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter receiver name" } },
      },
      receiverPhone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Please enter receiver phone number" },
          isNumeric: { msg: "Please enter correct receiver phone number" },
        },
      },
      shipmentDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: { notEmpty: { msg: "Please select shipment date" } },
      },
      inventoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please select inventory" } },
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: STATUS.PENDING,
        validate: { notEmpty: { msg: "status cannot be empty" } },
      },
      orderMemo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "DispatchOrder",
    }
  );
  DispatchOrder.addHook('afterUpdate', async (data, options) => {
    try {
      let prevDispatchOrder = data._previousDataValues;
      let newDispatchOrder = data.dataValues;
      // incase of outward internalIdForBusiness is not available.
      if (!prevDispatchOrder.internalIdForBusiness) {
        let where = {
          id: prevDispatchOrder.id
        }
        newDispatchOrder = await sequelize.models.DispatchOrder.findOne(
          {
            where,
            transaction: options.transaction
          }
        )
      }

      let where = {
        dispatchOrderId: newDispatchOrder.internalIdForBusiness
      }

      let dispatchOrderSummaries = await sequelize.models.DispatchOrderSummary.findAll({
        where
      })

      where = {
        id: newDispatchOrder.userId
      }
      let user = await sequelize.models.User.findOne({
        where,
        attribute: ["firstName", "lastName", "id"]
      })

      if (dispatchOrderSummaries.length) {
        await Promise.all(dispatchOrderSummaries.map(summary => {
          summary.receiverName = newDispatchOrder.receiverName
          summary.receiverPhone = newDispatchOrder.receiverPhone
          summary.shipmentDate = newDispatchOrder.shipmentDate
          summary.referenceId = newDispatchOrder.referenceId
          summary.status = newDispatchOrder.status
          summary.orderMemo = newDispatchOrder.orderMemo
          summary.userId = newDispatchOrder.userId
          summary.creatorName = `${user['firstName']} ${user['lastName']}`
          return summary.save()
        }));
      }

    } catch (error) {
      handleHookError(error, "DispatchOrder (Update)")
    }
  })


  return DispatchOrder;
};
