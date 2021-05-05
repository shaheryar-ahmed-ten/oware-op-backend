'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ProductOutwards', 'vehicleId',{
        type: Sequelize.INTEGER,
        allowNull: false,
      })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ProductOutwards');
  }
};