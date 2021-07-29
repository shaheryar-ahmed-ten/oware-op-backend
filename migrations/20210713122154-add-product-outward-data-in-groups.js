'use strict';
const { ProductOutward, DispatchOrder } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const outwardGroup = [];
    const productOutwards = await ProductOutward.findAll({ include: [DispatchOrder] });
    productOutwards.forEach(element => {
      const outwardObj = {
        outwardId: element.id,
        userId: element.userId,
        inventoryId: element.DispatchOrder.inventoryId,
        quantity: element.quantity,
        createdAt: element.createdAt,
        updatedAt: element.updatedAt
      };
      outwardGroup.push(outwardObj);
    });
    if (outwardGroup.length)
      await queryInterface.bulkInsert('OutwardGroups', outwardGroup);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('OutwardGroups');
  }
};
