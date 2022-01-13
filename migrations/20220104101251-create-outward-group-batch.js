"use strict";
const momenttz = require("moment-timezone");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("OutwardGroupBatches", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      outwardGroupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "OutwardGroups",
          key: "id",
        },
      },
      inventoryDetailId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "InventoryDetails",
          key: "id",
        },
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
    await queryInterface.dropTable("OutwardGroupBatches");
  },
};
