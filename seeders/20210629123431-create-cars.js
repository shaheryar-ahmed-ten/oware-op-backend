'use strict';
const { VehicleType, CarMake, CarModel, Car, User, Role } = require('../models')
const data = require('../cars.json');
const { ROLES } = require('../enums');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const defaultAdminUser = await User.findOne({ where: { '$Role.type$': ROLES.SUPER_ADMIN }, include: [Role] });
    const vehicleTypeIdMap = {};
    const makeIdMap = {};
    const modelIdMap = {};

    for (let index in data) {
      let area = data[index];
      try {
        vehicleTypeIdMap[area.vehicleType] = vehicleTypeIdMap[area.vehicleType] || (await VehicleType.create({
          userId: defaultAdminUser.id,
          name: area.vehicleType
        })).id;
        makeIdMap[area.make] = makeIdMap[area.make] || (await CarMake.create({
          userId: defaultAdminUser.id,
          name: area.make
        })).id;
        modelIdMap[area.model] = modelIdMap[area.model] || (await CarModel.create({
          userId: defaultAdminUser.id,
          name: area.model
        })).id;
        await Car.create({
          userId: defaultAdminUser.id,
          vehicleTypeId: vehicleTypeIdMap[area.vehicleType],
          makeId: makeIdMap[area.make],
          modelId: modelIdMap[area.model]
        });
      } catch (err) {
        console.log(err);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await Car.destroy({ where: {}, force: true });
    await CarMake.destroy({ where: {}, force: true });
    await CarModel.destroy({ where: {}, force: true });
    await VehicleType.destroy({ where: {}, force: true });
  }
};
