"use strict";
const {
  InwardGroupBatch,
  InwardGroup,
  InventoryDetail,
  ProductInward,
  Inventory,
} = require("../models");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    const inwardGroups = await InwardGroup.findAll({
      include: [
        {
          model: ProductInward,
          as: "ProductInward",
          attributes: ["customerId", "warehouseId"],
        },
      ],
      attributes: ["id", "quantity", "productId"],
    });
    for (const group of inwardGroups) {
      if (group.ProductInward) {
        const inv = await Inventory.findOne({
          include: ["InventoryDetail"],
          attributes: ["id"],
          where: {
            customerId: group.ProductInward.customerId,
            productId: group.productId,
            warehouseId: group.ProductInward.warehouseId,
          },
        });
        if (group && inv && inv.InventoryDetail) {
          await queryInterface.sequelize.query(`
            INSERT INTO InwardGroupBatches (inwardGroupId,inventoryDetailId,quantity) VALUES(${group.id},${inv.InventoryDetail[0].id},${group.quantity})
          `);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await InwardGroupBatch.destroy();
  },
};
