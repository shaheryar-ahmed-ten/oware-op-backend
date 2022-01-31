"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");
const { handleHookError } = require("../utility/utility");

module.exports = (sequelize, DataTypes) => {
  class Warehouse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Warehouse.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Warehouse.belongsTo(models.User, {
        foreignKey: "managerId",
        as: "Manager",
      });
      Warehouse.hasMany(models.Inventory, {
        foreignKey: "warehouseId",
      });
    }
  }
  const model = Warehouse.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      managerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      name: {
        type: DataTypes.STRING,
        unique: {
          msg: "Warehouse with this name already exist",
          fields: ["name"],
        },
      },
      businessWarehouseCode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: DataTypes.STRING,
      city: DataTypes.STRING,
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      memo: DataTypes.TEXT,
      capacity: DataTypes.FLOAT,
      locationLatlng: DataTypes.JSON,
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Warehouse",
    }
  );
  Warehouse.addHook('afterUpdate', async (data, options) => {
    try {
      const prevWarehouse = data._previousDataValues;
      const newWarehouse = data.dataValues;
      let where = {
        warehouseName: prevWarehouse.name
      }

      let inwardSummaries = await sequelize.models.InwardSummary.findAll({
        where
      })

      // resolve all the db calls at once
      if (inwardSummaries.length) {
        await Promise.all(inwardSummaries.map(summary => {
          summary.warehouseName = newWarehouse.name
          return summary.save()
        }));
      }

      let dispatchOrderSummaries = await sequelize.models.DispatchOrderSummary.findAll({
        where
      })

      if (dispatchOrderSummaries.length) {
        await Promise.all(dispatchOrderSummaries.map(summary => {
          summary.warehouseName = newWarehouse.name
          return summary.save()
        }));
      }

    } catch (error) {
      handleHookError(error, "WAREHOUSE")
    }
  })
  return Warehouse;
};
