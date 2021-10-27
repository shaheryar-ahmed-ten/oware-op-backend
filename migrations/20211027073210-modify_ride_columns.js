'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.changeColumn('Rides', 'pickupDate', {
    //   type: Sequelize.DATE,
    //   allowNull:true,
    // });
    await queryInterface.changeColumn('Rides', 'dropoffDate', {
      type: Sequelize.DATE,
      allowNull:true,
    });
    await queryInterface.changeColumn('Rides', 'pickupAddress', {
      type: Sequelize.STRING,
      allowNull:true,
    });
    await queryInterface.changeColumn('Rides', 'dropoffAddress', {
      type: Sequelize.STRING,
      allowNull:true,
    });
    await queryInterface.changeColumn('Rides', 'customerDiscount', {
      type: Sequelize.INTEGER,
      allowNull:true,
    });
    await queryInterface.changeColumn('Rides', 'driverIncentive', {
      type: Sequelize.INTEGER,
      allowNull:true,
    });
  },

  down: async (queryInterface, Sequelize) => {

    // await queryInterface.changeColumn('Rides', 'pickupDate', {
    //   type: Sequelize.DATE,
    //   allowNull:false,
    // });
    await queryInterface.changeColumn('Rides', 'dropoffDate', {
      type: Sequelize.DATE,
      allowNull:false,
    });
    await queryInterface.changeColumn('Rides', 'pickupAddress', {
      type: Sequelize.STRING,
      allowNull:false,
    });
    await queryInterface.changeColumn('Rides', 'dropoffAddress', {
      type: Sequelize.STRING,
      allowNull:false,
    });
    await queryInterface.changeColumn('Rides', 'customerDiscount', {
      type: Sequelize.INTEGER,
      allowNull:false,
    });
    await queryInterface.changeColumn('Rides', 'driverIncentive', {
      type: Sequelize.INTEGER,
      allowNull:false,
    });
  }
};
