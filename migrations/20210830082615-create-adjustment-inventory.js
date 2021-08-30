"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("AdjustmentInventories", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      adjustmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "StockAdjustments",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      inventoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Inventories",
          key: "id"
        },
        OnDelete: "CASCADE"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });

    await queryInterface.removeColumn("StockAdjustments", "inventoryId");
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("AdjustmentInventories");
    await queryInterface.addColumn("inventoryId", {
      type: Sequelize.INTEGER,
      references: {
        model: "Inventories",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    });
  }
};
