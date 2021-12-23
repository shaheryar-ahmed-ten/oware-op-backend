"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("Warehouses", "managerId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    });
    await queryInterface.addColumn("Warehouses", "locationLatlng", {
      type: Sequelize.JSON,
      allowNull: false,
    });
    await queryInterface.addColumn("Warehouses", "capacity", {
      type: Sequelize.FLOAT,
      allowNull: false,
    });

    await queryInterface.addColumn("Warehouses", "memo", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("Warehouses", "managerId");
    await queryInterface.removeColumn("Warehouses", "locationLatlng");
    await queryInterface.removeColumn("Warehouses", "capacity");
    await queryInterface.removeColumn("Warehouses", "memo");
  },
};
