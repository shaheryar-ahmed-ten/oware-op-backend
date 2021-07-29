'use strict';
const { DispatchOrder } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const orderGroup = [];
    const dispatchOrders = await DispatchOrder.findAll();
    dispatchOrders.forEach(element => {
      const orderObj = {
        orderId: element.id,
        userId: element.userId,
        inventoryId: element.inventoryId,
        quantity: element.quantity,
        createdAt: element.createdAt,
        updatedAt: element.updatedAt
      };
      orderGroup.push(orderObj);
    });
    if (orderGroup.length)
      await queryInterface.bulkInsert('OrderGroups', orderGroup);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("OrderGroups");
  }
};
