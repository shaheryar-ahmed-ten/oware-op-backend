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
      email: 'admin@yopmail.com',
      username: 'admin',
      isActive: true,
      password: 'admin',
      roleId: roles[1].dataValues.id,
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
    let permissionAccesses = await PermissionAccess.bulkCreate([{
      roleId: roles[0].dataValues.id,
      permissionId: permissions[0].dataValues.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      roleId: roles[1].dataValues.id,
      permissionId: permissions[1].dataValues.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
    return [roles, superUser, permissions, permissionAccesses];
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', null, {});
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Permissions', null, {});
    await queryInterface.bulkDelete('PermissionAccesses', null, {});
  }
};
