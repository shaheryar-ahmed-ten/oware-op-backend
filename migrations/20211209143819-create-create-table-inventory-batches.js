"use strict";

const momenttz = require("moment-timezone");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("InventoryDetails", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      batchNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      inventoryId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Inventories",
          key: "id",
        },
      },
      inwardQuantity: {
        type: Sequelize.INTEGER,
        // allowNull: false,
        // defaultValue: 0,
      },
      availableQuantity: {
        type: Sequelize.INTEGER,
      },
      outwardQuantity: {
        type: Sequelize.INTEGER,
        // allowNull: false,
        // defaultValue: 0,
      },
      internalIdForBusiness: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      manufacturingDate: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      expiryDate: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date(momenttz().tz("Africa/Abidjan")),
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("InventoryDetails");
  },
};
