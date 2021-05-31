'use strict';

const viewName = 'OutboundStats';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        CREATE VIEW ${viewName} AS
        SELECT PO.id AS id,
          Inventories.customerId,
          Inventories.warehouseId,
          Inventories.productId,
          Product.name AS product,
          Product.weight AS weight,
          Product.dimensionsCBM AS dimensionsCBM,
          UOM.name AS uom,
          Warehouse.name AS warehouse,
          Customer.companyName AS customer,
          DO.id AS dispatchOrderId,
          DO.quantity AS dispatchOrderQuantity,
          PO.quantity AS quantity,
          DO.createdAt AS dispatchOrderCreatedAt,
          PO.createdAt AS deletedAt,
          PO.createdAt AS updatedAt,
          PO.createdAt AS createdAt
        FROM ProductOutwards AS PO
          LEFT JOIN DispatchOrders AS DO ON PO.dispatchOrderId = DO.id
          LEFT JOIN Inventories ON DO.inventoryId = Inventories.id
          LEFT JOIN Products AS Product ON Inventories.productId = Product.id
          LEFT JOIN Warehouses AS Warehouse ON Inventories.warehouseId = Warehouse.id
          LEFT JOIN Customers AS Customer ON Inventories.customerId = Customer.id
          LEFT JOIN UOMs AS UOM ON Product.uomId = UOM.id;
  `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP VIEW ${viewName};`);
  }
};
