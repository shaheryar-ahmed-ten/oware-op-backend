'use strict';
const { Op } = require("sequelize");
const { Role, PermissionAccess, Permission } = require('../models')
const permissionEnums = require('../enums/permissions');
const { ROLES } = require('../enums');


module.exports = {
  up: async () => {
    const roles = await Role.findAll();
    const superAdminRole = roles.find(role => role.type == 'superAdmin' || role.type == ROLES.SUPER_ADMINf);
    const adminRole = roles.find(role => role.type == 'admin' || role.type == ROLES.ADMIN);
    superAdminRole.name = 'Super Admin';
    superAdminRole.type = ROLES.SUPER_ADMIN;
    adminRole.name = 'Admin';
    adminRole.type = ROLES.ADMIN;
    await superAdminRole.save();
    await adminRole.save();
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
    const superAdminRole = roles.find(role => role.type == 'superAdmin' || role.type == ROLES.SUPER_ADMIN);
    const adminRole = roles.find(role => role.type == 'admin' || role.type == ROLES.ADMIN);
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
