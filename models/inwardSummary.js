"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class InwardSummary extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here

        }
    }
    InwardSummary.init(
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            inwardId: {
                type: DataTypes.STRING,
                allowNull: false
            },
            customerName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            productName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            warehouseName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            uom: {
                type: DataTypes.STRING,
                allowNull: false
            },
            inwardQuantity: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            vehicleType: {
                type: DataTypes.STRING,
                allowNull: true
            },
            vehicleName: {
                type: DataTypes.STRING,
                allowNull: true
            },
            vehicleNumber: {
                type: DataTypes.STRING,
                allowNull: true
            },
            driverName: {
                type: DataTypes.STRING,
                allowNull: true
            },
            memo: {
                type: DataTypes.STRING,
                allowNull: true
            },
            referenceId: {
                type: DataTypes.STRING,
                allowNull: true
            },
            creatorName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            inwardDate: {
                type: DataTypes.DATE,
                allowNull: false
            },
            batchQuantity: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            batchNumber: {
                type: DataTypes.STRING,
                allowNull: true
            },
            manufacturingDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
            expiryDate: {
                type: DataTypes.DATE,
                allowNull: true
            },
        },
        {
            sequelize,
            paranoid: true,
            modelName: "InwardSummary",
        }
    );

    return InwardSummary;
}