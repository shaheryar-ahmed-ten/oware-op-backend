'use strict';

const viewName = 'InboundStats';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        CREATE VIEW ${viewName} AS
        SELECT
          ProductInwards.id,
          ProductInwards.customerId,
          ProductInwards.warehouseId,
          ProductInwards.productId,
          Product.name AS product,
          Product.weight,
          Product.dimensionsCBM,
          UOM.name AS uom,
          Warehouse.name AS warehouse,
          Customer.companyName AS customer,
          ProductInwards.createdAt,
          ProductInwards.updatedAt
        FROM ProductInwards
          LEFT JOIN Products AS Product ON ProductInwards.productId = Product.id
          LEFT JOIN Warehouses AS Warehouse ON ProductInwards.warehouseId = Warehouse.id
          LEFT JOIN Customers AS Customer ON ProductInwards.customerId = Customer.id
          LEFT JOIN UOMs AS UOM ON Product.uomId = UOM.id;
  `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP VIEW ${viewName};`);
  }
};
