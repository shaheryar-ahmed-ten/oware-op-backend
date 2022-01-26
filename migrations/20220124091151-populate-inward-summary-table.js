'use strict';
const { ProductInward, InwardSummary, User, Product, Company, Warehouse, InwardGroup, UOM } = require("../models");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    try {
      var limit = 10
      var totalInwardCounts = await ProductInward.count();
      var count = 10;
      var page = 1;

      while (count <= totalInwardCounts) {
        var offset = (page - 1 || 0) * limit;

        var response = await ProductInward.findAll({
          include: [
            { model: User },
            { model: Product, as: "Products", include: [{ model: UOM }] },
            { model: Company },
            { model: Warehouse },
            { model: InwardGroup, as: "InwardGroup", include: ["InventoryDetail"] }
          ],
          limit,
          offset
        });

        const inwardArray = [];
        for (const inward of response) {
          for (const Product of inward.Products) {
            if (Product.batchEnabled) {
              var invGroup = inward.InwardGroup.find((invGroup) => invGroup.id == Product.InwardGroup.id)
              for (const invDetail of invGroup.InventoryDetail) {
                inwardArray.push({
                  inwardId: inward.internalIdForBusiness || "",
                  customerName: inward.Company.name,
                  productName: Product.name,
                  warehouseName: inward.Warehouse.name,
                  uom: Product.UOM.name,
                  inwardQuantity: Product.InwardGroup.quantity,
                  vehicleType: inward.vehicleType || null,
                  vehicleName: inward.vehicleName || null,
                  vehicleNumber: inward.vehicleNumber || null,
                  driverName: inward.driverName || null,
                  memo: inward.memo || null,
                  referenceId: inward.referenceId || null,
                  creatorName: `${inward.User.firstName || ""} ${inward.User.lastName || ""}`,
                  userId: inward.User.id,
                  inwardDate: inward.createdAt,
                  batchQuantity: invDetail.InwardGroupBatch ? invDetail.InwardGroupBatch.quantity : "",
                  batchNumber: invDetail.batchNumber || null,
                  manufacturingDate: invDetail.manufacturingDate,
                  expiryDate: invDetail.expiryDate
                });
              }
            }
            else {
              inwardArray.push({
                inwardId: inward.internalIdForBusiness || "",
                customerName: inward.Company.name,
                productName: Product.name,
                warehouseName: inward.Warehouse.name,
                uom: Product.UOM.name,
                inwardQuantity: Product.InwardGroup.quantity,
                vehicleType: inward.vehicleType || null,
                vehicleName: inward.vehicleName || null,
                vehicleNumber: inward.vehicleNumber || null,
                driverName: inward.driverName || null,
                memo: inward.memo || null,
                referenceId: inward.referenceId || null,
                creatorName: `${inward.User.firstName || ""} ${inward.User.lastName || ""}`,
                userId: inward.User.id,
                inwardDate: inward.createdAt,
                batchQuantity: null,
                batchNumber: null,
                manufacturingDate: null,
                expiryDate: null
              });
            }
          }
        }

        await InwardSummary.bulkCreate(
          inwardArray
        )
        console.log("migration running")
        console.log("Completed Records", count)
        console.log("Total Records", totalInwardCounts)
        console.log("Remianing Records", totalInwardCounts - count)
        if (count == totalInwardCounts) {
          break
        }
        count = count + 10
        page++;
        if (count > totalInwardCounts) {
          count = totalInwardCounts
        }
      }

    } catch (err) {
      console.log("err", err);
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await InwardSummary.destroy({
      where: {}
    });
  }
};
