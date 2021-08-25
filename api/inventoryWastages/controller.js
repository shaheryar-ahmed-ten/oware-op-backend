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
        const inventory = await Inventory.findOne(
          {
            where: { productId: product.productId, customerId, warehouseId }
          },
          { transaction }
        );
        if (!inventory) throw new Error("Product doesn't exist in inventory");
        else {
          inventory.availableQuantity = inventory.availableQuantity - product.adjustmentQuantity;
          inventory.save({ transaction });
        }

        await Dao.InventoryWastage.create(
          {
            inventoryId: inventory.id,
            type: product.type ? product.type : null,
            reason: product.reason ? product.reason : null,
            adjustmentQuantity: product.adjustmentQuantity
          },
          { transaction }
        );
      }
    });
    return { status: httpStatus.OK, message: "Wastages added", data: null };
  } catch (err) {
    console.log("ERROR:", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to add Wastages" };
  }
}

async function getWastageById(params) {
  try {
    const record = await Dao.InventoryWastage.findOne(params);
    if (record) return { status: httpStatus.OK, message: "Data Found", data: record };
    else return { status: httpStatus.OK, message: "Data not Found", data: null };
  } catch (err) {
    console.log("ERROR:", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to get data" };
  }
}

async function updateWastage(params, req_body) {
  try {
    const inventoryWastage = await Dao.InventoryWastage.findOne(params);
    if (inventoryWastage) {
      inventoryWastage.Inventory.availableQuantity =
        inventoryWastage.Inventory.availableQuantity +
        inventoryWastage.adjustmentQuantity -
        req_body.adjustmentQuantity;
      inventoryWastage.adjustmentQuantity = req_body.adjustmentQuantity;
      await inventoryWastage.save();
      await inventoryWastage.Inventory.save();
      return { status: httpStatus.OK, message: "Data Found", data: inventoryWastage };
    } else return { status: httpStatus.OK, message: "Data not Found", data: null };
  } catch (err) {
    console.log("err", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to get data" };
  }
}

module.exports = { getWastages, addWastages, getWastageById, updateWastage };
