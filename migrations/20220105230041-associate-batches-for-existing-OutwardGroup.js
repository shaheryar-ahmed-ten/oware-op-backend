"use strict";
const {
  OutwardGroupBatch,
  OutwardGroup,
  InventoryDetail,
  ProductOutward,
  Inventory,
  DispatchOrder,
} = require("../models");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("OutwardGroupBatches", "quantity", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    const outwardGroups = await OutwardGroup.findAll({
      include: [
        {
          model: Inventory,
          attribute: ["customerId", "productId", "warehouseId"],
        },
      ],
      attribute: ["id", "quantity"],
    });
    for (const group of outwardGroups) {
      if (group && group.Inventory) {
        const inv = await Inventory.findOne({
          include: [
            {
              model: InventoryDetail,
              as: "InventoryDetail",
              attribute: ["id"],
            },
          ],
          where: {
            customerId: group.Inventory.customerId,
            productId: group.Inventory.productId,
            warehouseId: group.Inventory.warehouseId,
          },
        });
        if (group && inv && inv.InventoryDetail[0]) {
          await queryInterface.sequelize.query(`
              INSERT INTO OutwardGroupBatches (outwardGroupId,inventoryDetailId,quantity) VALUES(${group.id},${inv.InventoryDetail[0].id},${group.quantity})
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
    // await OutwardGroupBatch.destroy();
  },
};
