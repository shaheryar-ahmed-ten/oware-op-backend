'use strict';
const { ProductInward } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const inwardGroup= []
    const productInwards = await ProductInward.findAll();
    productInwards.forEach(element => {
      const inwardObj = {
        inwardId: element.id,
        userId: element.userId,
        productId: element.productId,
        quantity: element.quantity,
        createdAt: element.createdAt,
        updatedAt: element.updatedAt
      }
      inwardGroup.push(inwardObj)
    });
    await queryInterface.bulkInsert('InwardGroups', 
    inwardGroup
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("InwardGroups");
  }
};
