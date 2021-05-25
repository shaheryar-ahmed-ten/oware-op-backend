'use strict';
const { User, Role, PermissionAccess, Permission } = require('../models')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let roles = await Role.bulkCreate([{
      name: 'Admin',
      type: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      name: 'Admin',
      type: 'SUPER_ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    let superUser = await User.create({
      firstName: 'Yousha',
      lastName: 'Rizvi',
      email: 'admin@yopmail.com',
      username: 'admin',
      isActive: true,
      password: 'admin',
      roleId: roles[1].dataValues.id,
      phone: '03242363523',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return [roles, superUser];
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
    await queryInterface.bulkDelete('PermissionAccesses', null, {});
  }
};
