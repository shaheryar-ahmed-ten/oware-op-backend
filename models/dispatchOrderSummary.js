"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class DispatchOrderSummary extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here

        }
    }
    DispatchOrderSummary.init(
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            dispatchOrderId: {
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
            receiverName: {
                type: DataTypes.STRING,
                allowNull: true
            },
            receiverPhone: {
                type: DataTypes.STRING,
                allowNull: true
            },
            requestedQuantity: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            referenceId: {
                allowNull: true,
                type: DataTypes.STRING
            },
            creatorName: {
                allowNull: false,
                type: DataTypes.STRING
            },
            shipmentDate: {
                allowNull: false,
                type: DataTypes.DATE
            },
            status: {
                allowNull: false,
                type: DataTypes.INTEGER
            },
            orderMemo: {
                allowNull: true,
                type: DataTypes.STRING
            },
        },
        {
            sequelize,
            paranoid: true,
            modelName: "DispatchOrderSummary",
        }
    );

    return DispatchOrderSummary;
}