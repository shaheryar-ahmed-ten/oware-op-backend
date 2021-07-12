'use strict';
const { City, Zone, Area, User, Role } = require('../models')
const data = require('../zonal-areas.json');
const { ROLES } = require('../enums');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultAdminUser = await User.findOne({ where: { '$Role.type$': ROLES.SUPER_ADMIN }, include: [Role] });
    const cityIdMap = {};
    const zoneIdMap = {};

    for (let index in data) {
      let area = data[index];
      try {
        cityIdMap[area.city] = cityIdMap[area.city] || (await City.create({
          userId: defaultAdminUser.id,
          name: area.city
        })).id;
        zoneIdMap[area.zone] = zoneIdMap[area.zone] || (await Zone.create({
          userId: defaultAdminUser.id,
          name: area.zone,
          cityId: cityIdMap[area.city]
        })).id;
        await Area.create({
          userId: defaultAdminUser.id,
          name: area.area,
          cityId: cityIdMap[area.city],
          zoneId: zoneIdMap[area.zone]
        });
      } catch (err) {
        console.log(err);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await Area.destroy({ where: {}, force: true });
    await Zone.destroy({ where: {}, force: true });
    await City.destroy({ where: {}, force: true });
  }
};
