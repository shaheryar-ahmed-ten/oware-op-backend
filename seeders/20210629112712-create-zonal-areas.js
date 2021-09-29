"use strict";
const { City, Zone, Area, User, Role } = require("../models");
const data = require("../zonal-areas.json");
const { ROLES } = require("../enums");
const { Op } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultAdminUser = await User.findOne({ where: { "$Role.type$": ROLES.SUPER_ADMIN }, include: [Role] });
    const cityIdMap = {};
    const zoneIdMap = {};
    const areaIdMap = {};

    for (let index in data) {
      let area = data[index];
      try {
        const city = await City.findOne({ where: { name: { [Op.eq]: area.city } } });
        const cityId = city ? city.id : null;
        cityIdMap[area.city] =
          cityIdMap[area.city] ||
          cityId ||
          (
            await City.create({
              userId: defaultAdminUser.id,
              name: area.city,
            })
          ).id;
        const zone = await Zone.findOne({ where: { cityId: cityIdMap[area.city], name: area.zone } });
        if (zone !== null) zoneIdMap[area.zone] = zone.id;
        else
          zoneIdMap[area.zone] = (
            await Zone.create({
              userId: defaultAdminUser.id,
              name: area.zone,
              cityId: cityIdMap[area.city],
            })
          ).id;

        const areaAlreadyExist = await Area.findAll({
          where: { zoneId: zoneIdMap[area.zone], name: area.area },
        });
        if (areaAlreadyExist.length === 0)
          await Area.create({
            userId: defaultAdminUser.id,
            name: area.area,
            cityId: cityIdMap[area.city],
            zoneId: zoneIdMap[area.zone],
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
  },
};
