'use strict';
const { Company } = require('../models');
const { digitize } = require('../services/common.services');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Rides', 'manifestId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Files', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    await queryInterface.removeColumn('RideProducts', 'manifestId');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Rides', 'manifestId');
    await queryInterface.addColumn('RideProducts', 'manifestId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Files', // name of Target model
        key: 'id', // key in Target model that we're referencing
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  }
};