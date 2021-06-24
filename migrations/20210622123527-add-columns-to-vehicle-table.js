'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Vehicles', 'companyId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Companies', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.addColumn('Vehicles', 'driverId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Drivers', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.renameColumn('Vehicles', 'number','registrationNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Vehicles', 'carId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Cars', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.addColumn('Vehicles', 'photoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Files', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.addColumn('Vehicles', 'runningPaperId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Files', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.addColumn('Vehicles', 'routePermitId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Files', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Vehicles', 'companyId')
    await queryInterface.removeColumn('Vehicles', 'driverId')
    await queryInterface.removeColumn('Vehicles', 'carId')
    await queryInterface.removeColumn('Vehicles', 'photoId')
    await queryInterface.removeColumn('Vehicles', 'runningPaperId')
    await queryInterface.removeColumn('Vehicles', 'routePermitId')
    await queryInterface.renameColumn('Vehicles', 'registrationNumber','number');

  }
};
