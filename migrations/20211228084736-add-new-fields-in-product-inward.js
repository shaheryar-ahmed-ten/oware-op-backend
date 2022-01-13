"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn("ProductInwards", "vehicleType", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("ProductInwards", "vehicleName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("ProductInwards", "vehicleNumber", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("ProductInwards", "driverName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("ProductInwards", "memo", {
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
    await queryInterface.removeColumn("ProductInwards", "vehicleType");
    await queryInterface.removeColumn("ProductInwards", "vehicleName");
    await queryInterface.removeColumn("ProductInwards", "vehicleNumber");
    await queryInterface.removeColumn("ProductInwards", "driverName");
    await queryInterface.removeColumn("ProductInwards", "memo");
  },
};
