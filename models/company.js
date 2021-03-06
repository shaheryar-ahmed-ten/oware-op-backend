"use strict";
const { Model } = require("sequelize");
const config = require("../config");
const { PORTALS, RELATION_TYPES } = require("../enums");
const { handleHookError } = require("../utility/utility");

module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Company.belongsTo(models.User, {
        foreignKey: "userId",
      });
      Company.belongsTo(models.User, {
        foreignKey: "contactId",
        as: "Contact",
      });
      Company.belongsTo(models.User, {
        foreignKey: "pocUserId",
        as: "pocUser",
      });
      Company.hasMany(models.User, {
        foreignKey: "companyId",
        as: "Employees",
      });
      Company.hasMany(models.Driver, {
        foreignKey: "companyId",
        as: "Drivers",
      });
      Company.hasMany(models.Vehicle, {
        foreignKey: "companyId",
        as: "Vehicles",
      });
      Company.hasMany(models.Inventory, { foreignKey: "customerId" });
    }
  }
  Company.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true },
      },
      relationType: {
        type: DataTypes.ENUM({
          values: Object.keys(RELATION_TYPES),
        }),
        defaultValue: RELATION_TYPES.CUSTOMER,
      },
      internalIdForBusiness: DataTypes.STRING,
      logoId: DataTypes.INTEGER,
      type: DataTypes.STRING,
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please select a contact" } },
      },
      pocUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter company name" } },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      allowedApps: {
        type: DataTypes.ENUM({
          values: Object.keys(PORTALS),
        }),
        allowNull: false,
        defaultValue: PORTALS.CUSTOMER,
      },
      notes: DataTypes.STRING,
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Company",
    }
  );
  Company.addHook("afterUpdate", async (data, options) => {
    try {
      const prevCompany = data._previousDataValues;
      const newCompany = data.dataValues;
      let where = {
        customerName: prevCompany.name,
      };

      let inwardSummaries = await sequelize.models.InwardSummary.findAll({
        where,
      });

      // resolve all the db calls at once
      if (inwardSummaries.length) {
        await Promise.all(
          inwardSummaries.map((summary) => {
            summary.customerName = newCompany.name;
            return summary.save();
          })
        );
      }

      let dispatchOrderSummaries =
        await sequelize.models.DispatchOrderSummary.findAll({
          where,
        });

      if (dispatchOrderSummaries.length) {
        await Promise.all(
          dispatchOrderSummaries.map((summary) => {
            summary.customerName = newCompany.name;
            return summary.save();
          })
        );
      }
    } catch (error) {
      handleHookError(error, "COMPANY");
    }
  });

  return Company;
};
