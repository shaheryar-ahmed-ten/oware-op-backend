const httpStatus = require("http-status");
const Dao = require("../../dao");
const { Inventory, sequelize } = require("../../models");

async function getWastages(params) {
  try {
    const response = await Dao.InventoryWastage.findAndCountAll(params);
    // console.log("response.records", response.records);
    if (response.count)
      return {
        success: httpStatus.OK,
        message: "Data Found",
        data: response.records,
        pages: Math.ceil(response.count / params.limit)
      };
    else return { success: httpStatus.OK, message: "Data not Found", data: [] };
  } catch (err) {
    console.log("ERROR:", err);
    return {
      success: httpStatus.CONFLICT,
      message: err.message,
      code: "Failed to get data"
    };
  }
}

async function addWastages(params, adminId) {
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
            adjustmentQuantity: product.adjustmentQuantity,
            adminId
          },
          { transaction }
        );
      }
    });
    return { success: httpStatus.OK, message: "Wastages added", data: [] };
  } catch (err) {
    console.log("ERROR:", err);
    return { success: httpStatus.CONFLICT, message: err.message, code: "Failed to add Wastages" };
  }
}

async function getWastageById(params) {
  try {
    const response = await Dao.InventoryWastage.findOne(params);
    if (response) return { status: httpStatus.OK, message: "Data Found", data: response };
    else return { status: httpStatus.OK, message: "Data not Found", data: [] };
  } catch (err) {
    console.log("ERROR:", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to get data" };
  }
}

async function updateWastage(params, req_body) {
  try {
    const inventoryWastage = await Dao.InventoryWastage.findOne(params);
    if (inventoryWastage) {
      if (req_body.adjustmentQuantity) {
        inventoryWastage.Inventory.availableQuantity =
          inventoryWastage.Inventory.availableQuantity +
          inventoryWastage.adjustmentQuantity -
          req_body.adjustmentQuantity;
        inventoryWastage.adjustmentQuantity = req_body.adjustmentQuantity;
      }
      if (req_body.reason) inventoryWastage.reason = req_body.reason;
      if (req_body.type) inventoryWastage.type = req_body.type;
      await inventoryWastage.save();
      await inventoryWastage.Inventory.save();
      return { status: httpStatus.OK, message: "Data Updated", data: inventoryWastage };
    } else return { status: httpStatus.OK, message: "Data not Found", data: null };
  } catch (err) {
    console.log("err", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to update data" };
  }
}

async function deleteWastage(id) {
  try {
    const response = await Dao.InventoryWastage.findByPk(id);
    if (response) {
      body = await Dao.InventoryWastage.delete(id);
      return { success: httpStatus.OK, message: "Adjustment deleted", data: response };
    } else {
      return { success: httpStatus.OK, message: "Adjustment doesn't exist", data: null };
    }
  } catch (err) {
    console.log("ERROR:", err);
    return { success: httpStatus.CONFLICT, message: err.message, code: "Failed to delete" };
  }
}

module.exports = { getWastages, addWastages, getWastageById, updateWastage, deleteWastage };
