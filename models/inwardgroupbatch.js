"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcrypt");

module.exports = (sequelize, DataTypes) => {
  class InwardGroupBatch extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      InwardGroupBatch.belongsTo(models.InwardGroup, {
        foreignKey: "inwardGroupId",
        as: "InwardGroup",
      });
      InwardGroupBatch.belongsTo(models.InventoryDetail, {
        foreignKey: "inventoryDetailId",
        as: "InventoryDetail",
      });
    }
  }
  InwardGroupBatch.init(
    {
      inwardGroupId: {
        type: DataTypes.INTEGER,
        validate: {
          isInt: { msg: "Please enter group Id" },
        },
      },
      inventoryDetailId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { notEmpty: { msg: "Please provide inventoryDetailId" } },
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      paranoid: true,
      modelName: "InwardGroupBatch",
    }
  );

  InwardGroupBatch.addHook('afterCreate', async (data, options) => {
    try {
      const inwardGroupBatch = data.toJSON()

      var where = {
        id: inwardGroupBatch.inventoryDetailId
      }
      var inventoryDetails = await sequelize.models.InventoryDetail.findOne({
        where,
        attributes: ["InventoryId", "batchName", "manufacturingDate", "expiryDate", "batchNumber", "inwardQuantity", "availableQuantity", "outwardQuantity"],
        raw: true // to get data in json like format
      })

      where = {
        id: inwardGroupBatch.inwardGroupId
      }
      var inwardGroup = await sequelize.models.InwardGroup.findOne({
        where,
        attributes: ["id", "quantity", "productId", "inwardId", "inventoryDetailId"],
        include: [{
          model: sequelize.models.Product,
          attributes: ["id", "name", "batchEnabled"],
          include: [{
            model: sequelize.models.UOM,
            attributes: ["id", "name"],
          }]
        }],
        raw: true // to get data in json like format
      })
      where = {
        id: inwardGroup.inwardId
      }
      var productInward = await sequelize.models.ProductInward.findOne({
        where,
        include: [
          {
            model: sequelize.models.Company,
            attributes: ["name"],
          },
          {
            model: sequelize.models.Warehouse,
            attributes: ["name"]
          },
          {
            model: sequelize.models.User,
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        attributes: ["id", "userId", "internalIdForBusiness", "customerId", "referenceId", "warehouseId", "vehicleType", "vehicleName", "vehicleNumber", "driverName", "memo", "createdAt"],
        raw: true
      })
      // object to be saved in table
      let newInwardObj = {
        inwardId: productInward['internalIdForBusiness'],
        customerName: productInward['Company.name'],
        productName: inwardGroup['Product.name'],
        warehouseName: productInward['Warehouse.name'],
        uom: inwardGroup['Product.UOM.name'],
        inwardQuantity: inwardGroup['quantity'],
        vehicleType: productInward['vehicleType'] || null,
        vehicleName: productInward['vehicleName'] || null,
        vehicleNumber: productInward['vehicleNumber'] || null,
        driverName: productInward['driverName'] || null,
        memo: productInward['memo'] || null,
        referenceId: productInward['referenceId'] || null,
        creatorName: `${productInward['User.firstName'] || ''} productInward['User.lastName'] || ''`,
        userId: productInward['User.id'],
        inwardDate: productInward['inwardDate'] ? productInward['inwardDate'] : productInward['createdAt'],
        batchQuantity: inwardGroup['Product.batchEnabled'] ? inventoryDetails['inwardQuantity'] : null,
        batchNumber: inwardGroup['Product.batchEnabled'] ? inventoryDetails['batchNumber'] || null : null,
        manufacturingDate: inwardGroup['Product.batchEnabled'] ? inventoryDetails['manufacturingDate'] || null : null,
        expiryDate: inwardGroup['Product.batchEnabled'] ? inventoryDetails['expiryDate'] : null
      }
      // update the summary table
      await sequelize.models.InwardSummary.create(newInwardObj)
      console.log("Summary updated successfully")

    } catch (error) {
      console.log("Something went wrong", error)
    }

  });
  return InwardGroupBatch;
};
