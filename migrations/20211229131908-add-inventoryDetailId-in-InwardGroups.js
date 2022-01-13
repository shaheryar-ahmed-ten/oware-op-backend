"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("InwardGroups", "inventoryDetailId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "InventoryDetails", // name of Target model
        key: "id", // key in Target model that we're referencing
      },
    });

    await queryInterface.renameColumn(
      "InventoryDetails",
      "internalIdForBusiness",
      "batchName"
    );
    await queryInterface.changeColumn("InventoryDetails", "batchName", {
      allowNull: true,
      type: Sequelize.STRING,
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("InwardGroups", "inventoryDetailId");
    await queryInterface.renameColumn(
      "InventoryDetails",
      "batchName",
      "internalIdForBusiness"
    );
    await queryInterface.changeColumn(
      "InventoryDetails",
      "internalIdForBusiness",
      {
        allowNull: true,
        type: Sequelize.STRING,
      }
    );
  },
};
