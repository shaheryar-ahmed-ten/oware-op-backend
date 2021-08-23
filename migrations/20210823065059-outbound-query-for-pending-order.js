'use strict';

const viewName = 'OutboundQueryForPending';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        CREATE VIEW ${viewName} AS
        SELECT ROW_NUMBER() OVER(ORDER BY (SELECT 1)) id,
          Inventories.customerId,
          Inventories.warehouseId,
          Inventories.productId,
          COALESCE(PO.quantity, 0) AS productOutwardQuantity,
          Company.name AS customer,
          DO.id AS dispatchOrderId,
          DO.quantity AS dispatchOrderQuantity,
          PO.id AS productOutwardId,
          DO.createdAt AS dispatchOrderCreatedAt,
          PO.deletedAt AS deletedAt,
          PO.updatedAt AS updatedAt,
          PO.createdAt AS createdAt
          FROM ProductOutwards AS PO
          RIGHT JOIN DispatchOrders AS DO ON PO.dispatchOrderId = DO.id
          LEFT JOIN Inventories ON DO.inventoryId = Inventories.id
          LEFT JOIN Products AS Product ON Inventories.productId = Product.id
          LEFT JOIN Warehouses AS Warehouse ON Inventories.warehouseId = Warehouse.id
          LEFT JOIN Companies AS Company ON Inventories.customerId = Company.id;
  `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP VIEW ${viewName};`);
  }
};
