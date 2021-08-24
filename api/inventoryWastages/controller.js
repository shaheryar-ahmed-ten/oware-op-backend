const httpStatus = require("http-status");
const Dao = require("../../dao");
const { Inventory, sequelize } = require("../../models");

async function getWastages(params) {
  try {
    const records = await Dao.InventoryWastage.findAndCountAll(params);
    if (records.count) return { status: httpStatus.OK, message: "Data Found", data: records };
    else return { status: httpStatus.OK, message: "Data not Found", data: null };
  } catch (err) {
    console.log("ERROR:", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to get data" };
  }
}

async function addWastages(params) {
  try {
    await sequelize.transaction(async transaction => {
      const { warehouseId, customerId, adjustment_products } = params;
      for (const product of adjustment_products) {
        return Inventory.findOne(
          {
            where: { productId: product.productId, customerId, warehouseId }
          },
          { transaction }
        )
          .then(inventory => {
            console.log("inventory", inventory);
            if (!inventory) throw new Error("Product doesn't exist in inventory");
            else {
              inventory.availableQuantity = inventory.availableQuantity - product.adjustmentQuantity;
              inventory.save({ transaction });
              return inventory;
            }
          })
          .then(inventory => {
            console.log("---------- debug 2-------------------------", inventory);
            Dao.InventoryWastage.create(
              {
                inventoryId: inventory.id,
                type: product.type ? product.type : null,
                reason: product.reason ? product.reason : null,
                adjustmentQuantity: product.adjustmentQuantity
              },
              { transaction }
            );
            return inventory;
          });
      }
      console.log("--------------- debug 3 --------------------------");
      return { status: httpStatus.OK, message: "Wastages added", data: null };
    });
  } catch (err) {
    console.log("ERROR:", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to add Wastages" };
  }
}

module.exports = { getWastages, addWastages };
