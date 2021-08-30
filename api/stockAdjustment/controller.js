const httpStatus = require("http-status");
const Dao = require("../../dao");
const { Inventory, sequelize } = require("../../models");

async function getWastages(params) {
  try {
    const response = await Dao.StockAdjustment.findAndCountAll(params);
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
    // const stockAdjustment = await sequelize.transaction(async transaction => {
    const adjustment = await Dao.StockAdjustment.create(
      {
        adminId
      }
      // { transaction }
    );

    params = await Promise.all(
      params.map(async param => {
        const { customerId, productId, warehouseId } = param;
        const inventory = await Dao.Inventory.findOne({ where: { customerId, productId, warehouseId } });
        param["inventoryId"] = inventory.id;
        param["adjustmentId"] = adjustment.id;
        return param;
      })
    );
    console.log("params", params);
    const inv = await Dao.AdjustmentInventory.bulkCreate(params);
    console.log("inv", inv);
    // return adjustment;
    // });
    return { success: httpStatus.OK, message: "Stock Adjustment added", data: adjustment };
  } catch (err) {
    console.log("ERROR:", err);
    return { success: httpStatus.CONFLICT, message: err.message, code: "Failed to add Wastages" };
  }
}

async function getWastageById(params) {
  try {
    const response = await Dao.StockAdjustment.findOne(params);
    if (response) return { status: httpStatus.OK, message: "Data Found", data: response };
    else return { status: httpStatus.OK, message: "Data not Found", data: [] };
  } catch (err) {
    console.log("ERROR:", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to get data" };
  }
}

async function updateWastage(params, req_body) {
  try {
    const inventoryWastage = await Dao.StockAdjustment.findOne(params);
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
    const response = await Dao.StockAdjustment.findByPk(id);
    if (response) {
      body = await Dao.StockAdjustment.delete(response);
      return { success: httpStatus.OK, message: "Adjustment deleted", data: response };
    } else {
      return { success: httpStatus.OK, message: "Adjustment doesn't exist", data: null };
    }
  } catch (err) {
    console.log("ERROR:", err);
    return { success: httpStatus.CONFLICT, message: err.message, code: "Failed to delete" };
  }
}

async function getRelations(params) {
  try {
    const company = await Dao.Company.findAll(params);
    const warehouse = await Dao.Warehouse.findAll(params);
    const product = await Dao.Product.findAll(params);
    const records = { company, warehouse, product };
    return { success: httpStatus.OK, message: "data found", data: records };
  } catch (err) {
    console.log("err", err);
    return { success: httpStatus.CONFLICT, message: err.message, code: "Failed to found data" };
  }
}

async function getWastagesType(params) {
  try {
    const WastagesType = await Dao.WastagesType.findAll(params);
    return { success: httpStatus.OK, message: "wastages type found", data: WastagesType };
  } catch (err) {
    console.log("err", err);
    return { success: httpStatus.CONFLICT, message: err.message, code: "Failed to found data" };
  }
}

module.exports = {
  getWastages,
  addWastages,
  getWastageById,
  updateWastage,
  deleteWastage,
  getRelations,
  getWastagesType
};
