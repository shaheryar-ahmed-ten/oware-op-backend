'use strict';

const viewName = 'OutboundStats';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
        CREATE VIEW ${viewName} AS
        SELECT ROW_NUMBER() OVER(ORDER BY (SELECT 1)) id,
          Inventories.customerId,
          Inventories.warehouseId,
          Inventories.productId,
          Product.name AS product,
          Product.weight AS weight,
          Product.dimensionsCBM AS dimensionsCBM,
          UOM.name AS uom,
          Warehouse.name AS warehouse,
          Customer.companyName AS customer,
          DO.referenceId AS referenceId,
          DO.internalIdForBusiness AS internalIdForBusiness,
          DO.id AS dispatchOrderId,
          DO.shipmentDate AS shipmentDate,
          DO.quantity AS dispatchOrderQuantity,
          PO.vehicleId AS vehicleId,
          PO.id AS productOutwardId,
          COALESCE(PO.quantity, 0) AS productOutwardQuantity,
          DO.createdAt AS dispatchOrderCreatedAt,
          PO.createdAt AS deletedAt,
          PO.createdAt AS updatedAt,
          PO.createdAt AS createdAt
          FROM ProductOutwards AS PO
          RIGHT JOIN DispatchOrders AS DO ON PO.dispatchOrderId = DO.id
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
