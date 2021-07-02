'use strict';
const { User, Role } = require('../models');
const { ROLES } = require('../enums');
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultAdminUser = await User.findOne({ where: { '$Role.type$': ROLES.SUPER_ADMIN }, include: [Role] });
    await queryInterface.addColumn('Drivers', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('Vehicles', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.removeColumn('Vehicles', 'type');
    await queryInterface.addColumn('Cars', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('CarMakes', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('CarModels', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('VehicleTypes', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn('Drivers', 'userId', {
      type: Sequelize.INTEGER,
      defaultValue: defaultAdminUser.id,
      allowNull: false,
      references: {
        model: 'Users', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addColumn('Vehicles', 'userId', {
      type: Sequelize.INTEGER,
      defaultValue: defaultAdminUser.id,
      allowNull: false,
      references: {
        model: 'Users', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addColumn('Cars', 'userId', {
      type: Sequelize.INTEGER,
      defaultValue: defaultAdminUser.id,
      allowNull: false,
      references: {
        model: 'Users', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addColumn('CarMakes', 'userId', {
      type: Sequelize.INTEGER,
      defaultValue: defaultAdminUser.id,
      allowNull: false,
      references: {
        model: 'Users', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addColumn('CarModels', 'userId', {
      type: Sequelize.INTEGER,
      defaultValue: defaultAdminUser.id,
      allowNull: false,
      references: {
        model: 'Users', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
    await queryInterface.addColumn('VehicleTypes', 'userId', {
      type: Sequelize.INTEGER,
      defaultValue: defaultAdminUser.id,
      allowNull: false,
      references: {
        model: 'Users', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Drivers', 'isActive');
    await queryInterface.removeColumn('Vehicles', 'isActive');
    // await queryInterface.addColumn('Vehicles', 'type', {
    //   type: Sequelize.STRING
    // });
    await queryInterface.removeColumn('Cars', 'isActive');
    await queryInterface.removeColumn('CarMakes', 'isActive');
    await queryInterface.removeColumn('CarModels', 'isActive');
    await queryInterface.removeColumn('VehicleTypes', 'isActive');
    await queryInterface.removeColumn('Drivers', 'userId');
    await queryInterface.removeColumn('Vehicles', 'userId');
    await queryInterface.removeColumn('Cars', 'userId');
    await queryInterface.removeColumn('CarMakes', 'userId');
    await queryInterface.removeColumn('CarModels', 'userId');
    await queryInterface.removeColumn('VehicleTypes', 'userId');
  }
};
