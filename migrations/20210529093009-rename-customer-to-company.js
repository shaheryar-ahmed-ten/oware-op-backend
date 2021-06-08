'use strict';
const { query } = require('express');
const { ROLES, APPS } = require('../enums');
const { Role, PermissionAccess, Permission } = require('../models')
const { Op } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameTable('Customers', 'Companies');
    await queryInterface.renameColumn('Companies', 'companyName', 'name');
    await queryInterface.addColumn('Companies', 'allowedApps', {
      type: Sequelize.STRING,
      defaultValue: APPS.CUSTOMER
    });
    await queryInterface.addColumn('Roles', 'allowedApps', {
      type: Sequelize.STRING,
      defaultValue: APPS.OPERATIONS
    });
    await queryInterface.addColumn('Permissions', 'allowedApps', {
      type: Sequelize.STRING,
      defaultValue: APPS.OPERATIONS
    });
    await Role.update({
      allowedApps: APPS.CUSTOMER
    }, {
      where: { type: ROLES.CUSTOMER_SUPER_ADMIN }
    });
    await Permission.update({
      allowedApps: APPS.CUSTOMER
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