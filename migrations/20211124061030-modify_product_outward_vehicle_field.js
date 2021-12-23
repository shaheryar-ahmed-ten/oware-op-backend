'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ProductOutwards', 'externalVehicle',{
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.changeColumn('ProductOutwards', 'vehicleId',{
      type: Sequelize.INTEGER,
      allowNull: true,
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ProductOutwards','externalVehicle');
    await queryInterface.changeColumn('ProductOutwards', 'vehicleId',{
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  }
};
