'use strict';
const { Company } = require('../models');
const { digitize } = require('../services/common.services');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Companies', 'internalIdForBusiness', {
      type: Sequelize.STRING(30),
      allowNull: true
    });
    const companies = await Company.findAll();
    for (var i in companies) {
      let company = companies[i];
      company.internalIdForBusiness = company.name[0] + ((company.type && company.type[0]) || "" + company.relationType[0]) + '-' + digitize(company.id, 3);
      await company.save();
    }
    return
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Companies', 'internalIdForBusiness');
  }
};