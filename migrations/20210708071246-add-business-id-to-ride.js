'use strict';
const { Ride } = require('../models');
const { digitize } = require('../services/common.services');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Rides', 'internalIdForBusiness', {
      type: Sequelize.STRING(30),
      allowNull: true
    });
    const rides = await Ride.findAll();
    for (var i in rides) {
      let company = rides[i];
      company.internalIdForBusiness = digitize(company.id, 6);
      await company.save();
    }
    return
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Rides', 'internalIdForBusiness');
  }
};