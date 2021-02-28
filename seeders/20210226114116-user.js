'use strict';
const { User, Role, PermissionAccess, Permission } = require('../models')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    let roles = await Role.bulkCreate([{
      name: 'Admin',
      type: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      name: 'Admin',
      type: 'superAdmin',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    let superUser = await User.create({
      firstName: 'Yousha',
      lastName: 'Rizvi',
      email: 'yousha@yopmail.com',
      username: 'yousha',
      isActive: true,
      password: 'yousha',
      role_id: roles[1].dataValues.id,
      phone: '03242363523',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    let permissions = await Permission.bulkCreate([{
      type: 'admin_privileges',
      name: 'Admin Privileges',
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      type: 'superadmin_privileges',
      name: 'Super Admin Privileges',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    let permission_accesses = await PermissionAccess.bulkCreate([{
      role_id: roles[0].dataValues.id,
      permission_id: permissions[0].dataValues.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      role_id: roles[1].dataValues.id,
      permission_id: permissions[1].dataValues.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    return [roles, superUser, permissions, permission_accesses];
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
    await queryInterface.bulkDelete('PermissionAccesses', null, {});
  }
};
