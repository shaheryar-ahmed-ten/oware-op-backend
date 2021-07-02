'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Rides', 'price', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Rides', 'cost', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Rides', 'customerDiscount', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('Rides', 'driverIncentive', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Rides', 'price')
    await queryInterface.removeColumn('Rides', 'cost')
    await queryInterface.removeColumn('Rides', 'customerDiscount')
    await queryInterface.removeColumn('Rides', 'driverIncentive')
  }
};
