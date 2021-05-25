'use strict';
const { Op } = require("sequelize");
const { User, Role, PermissionAccess, Permission } = require('../models')
const permissionEnums = require('../enums/permissions');

module.exports = {
  up: async () => {
    const roles = await Role.findAll();
    const superAdminRole = roles.find(role => ['superAdmin', 'SUPER_ADMIN'].indexOf(role.type) > -1);
    const adminRole = roles.find(role => ['admin', 'ADMIN'].indexOf(role.type) > -1);
    superAdminRole.type = 'SUPER_ADMIN';
    adminRole.type = 'ADMIN';
    superAdminRole.save();
    adminRole.save();
    const superAdminPermissions = await Permission.findAll({
      where: {
        type: {
          [Op.in]: Object.keys(permissionEnums).filter(type => type.indexOf('_FULL') > -1)
        }
      }
    });
    const adminPermissions = superAdminPermissions.filter(permission => permission.type != 'OPS_USER_FULL')
    let permissionAccesses = await PermissionAccess.bulkCreate([
      ...superAdminPermissions.map(permission => ({
        roleId: superAdminRole.id,
        permissionId: permission.id,
      })),
      ...adminPermissions.map(permission => ({
        roleId: adminRole.id,
        permissionId: permission.id,
      }))]);
    return [permissionAccesses];
  },
  down: async () => {
    const roles = await Role.findAll();
    const superAdminRole = roles.find(role => role.type == 'SUPER_ADMIN');
    const adminRole = roles.find(role => role.type == 'ADMIN');
    const permissions = await Permission.findAll({
      where: {
        type: {
          [Op.in]: Object.keys(permissionEnums).filter(type => type.indexOf('_FULL') > -1)
        }
      }
    });
    const deletions = await PermissionAccess.destroy({
      where: {
        permissionId: { [Op.in]: permissions.map(perm => perm.id) },
        roleId: { [Op.in]: [superAdminRole.id, adminRole.id] }
      },
      force: true
    });
  }
};
