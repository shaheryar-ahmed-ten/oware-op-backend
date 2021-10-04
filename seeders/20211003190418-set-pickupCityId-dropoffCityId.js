"use strict";
const Dao = require("../dao");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    const rides = await Dao.Ride.findAll({
      include: [
        {
          model: Area,
          include: [{ model: Zone, include: [City] }],
          as: "PickupArea",
        },
        {
          model: Area,
          include: [{ model: Zone, include: [City] }],
          as: "DropoffArea",
        },
      ],
    });

    for (const ride of rides) {
      ride.dataValues["pickupCityId"] = ride.PickupArea.City.name;
      ride.dataValues["dropOffCityId"] = ride.DropoffArea.City.name;
      await ride.save();
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
