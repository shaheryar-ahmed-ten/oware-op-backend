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
      },
      reason: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "WastagesTypes",
          key: "id"
        }
      },
      comment: {
        type: Sequelize.STRING,
        allowNull: true
      },
      adjustmentQuantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });

    await queryInterface.removeColumn("StockAdjustments", "inventoryId");
    await queryInterface.removeColumn("StockAdjustments", "type");
    await queryInterface.removeColumn("StockAdjustments", "reason");
    await queryInterface.removeColumn("StockAdjustments", "adjustmentQuantity");
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("AdjustmentInventories");
    await queryInterface.addColumn("StockAdjustments", "inventoryId", {
      type: Sequelize.INTEGER,
      references: {
        model: "Inventories",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE"
    });
    await queryInterface.addColumn("StockAdjustments", "type", {
      type: Sequelize.INTEGER,
      references: {
        model: "WastagesTypes",
        key: "id"
      }
    });
    await queryInterface.addColumn("StockAdjustments", "reason", { type: Sequelize.STRING });
    await queryInterface.addColumn("StockAdjustments", "adjustmentQuantity", { type: Sequelize.INTEGER });
  }
};
