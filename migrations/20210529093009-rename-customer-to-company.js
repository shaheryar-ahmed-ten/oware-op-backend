'use strict';
const { query } = require('express');
const { ROLES, PORTALS } = require('../enums');
const { Role, Permission } = require('../models')
const { Op } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('Customers', 'Companies');
    await queryInterface.renameColumn('Companies', 'companyName', 'name');
    await queryInterface.addColumn('Companies', 'allowedApps', {
      type: Sequelize.STRING,
      defaultValue: PORTALS.CUSTOMER
    });
    await queryInterface.addColumn('Roles', 'allowedApps', {
      type: Sequelize.STRING,
      defaultValue: PORTALS.OPERATIONS
    });
    await queryInterface.addColumn('Permissions', 'allowedApps', {
      type: Sequelize.STRING,
      defaultValue: PORTALS.OPERATIONS
    });
    await Role.update({
      allowedApps: PORTALS.CUSTOMER
    }, {
      where: { type: ROLES.CUSTOMER_SUPER_ADMIN }
    });
    await Permission.update({
      allowedApps: PORTALS.CUSTOMER
    }, {
      where: {
        type: {
          [Op.like]: 'CP_%'
        }
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Companies', 'allowedApps');
    await queryInterface.removeColumn('Roles', 'allowedApps');
    await queryInterface.removeColumn('Permissions', 'allowedApps');
    await queryInterface.renameColumn('Companies', 'name', 'companyName');
    await queryInterface.renameTable('Companies', 'Customers');
  }
};