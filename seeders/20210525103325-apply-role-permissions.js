'use strict';
const { Op } = require("sequelize");
const { User, Role, PermissionAccess, Permission } = require('../models')
const permissionEnums = require('../enums/permissions');

module.exports = {
  up: async () => {
    const adminRole = await Role.findOne({ where: { type: 'superAdmin' } });
    const permissions = await Permission.findAll({
      where: {
        type: {
          [Op.in]: Object.keys(permissionEnums).filter(type => type.indexOf('_FULL') > -1)
        }
      }
    });
    let permissionAccesses = await PermissionAccess.bulkCreate(permissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    })));
    return [permissionAccesses];
  },
  down: async () => {
    const adminRole = await Role.findOne({ type: 'superAdmin' });
    const permissions = await Permission.findAll({
      where: {
        type: {
          [Op.in]: Object.keys(permissionEnums).filter(type => type.indexOf('_FULL') > -1)
        }
      }
    });
    PermissionAccess.destroy({
      where: {
        permissionId: {
          [Op.in]: permissions.map(perm => perm.id)
        },
        roleId: adminRole.id
      }
    })
  }
};
