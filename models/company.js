"use strict";
const { Model } = require("sequelize");
const config = require("../config");
const { PORTALS, RELATION_TYPES } = require("../enums");

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
        foreignKey: "userId"
      });
      Company.belongsTo(models.User, {
        foreignKey: "contactId",
        as: "Contact"
      });
      Company.hasMany(models.User, {
        foreignKey: "companyId",
        as: "Employees"
      });
      Company.hasMany(models.Driver, {
        foreignKey: "companyId",
        as: "Drivers"
      });
      Company.hasMany(models.Vehicle, {
        foreignKey: "companyId",
        as: "Vehicles"
      });
      Company.hasMany(models.Inventory, { foreignKey: "customerId" });
    }
  }
  Company.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: true }
      },
      relationType: {
        type: DataTypes.ENUM({
          values: Object.keys(RELATION_TYPES)
        }),
        defaultValue: RELATION_TYPES.CUSTOMER
      },
      internalIdForBusiness: DataTypes.STRING,
      logoId: DataTypes.INTEGER,
      type: DataTypes.STRING,
      contactId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please select a contact" } }
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: "Please enter company name" } }
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true, // TODO: set this to false after handling already added companies.
        validate: {
          isNumeric: { msg: "Please enter correct phone number for company." }
        }
      },
      allowedApps: {
        type: DataTypes.ENUM({
          values: Object.keys(PORTALS)
        }),
        allowNull: false,
        defaultValue: PORTALS.CUSTOMER
      },
      notes: DataTypes.STRING,
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      paranoid: true,
      modelName: "Company"
    }
  );

  return Company;
};
