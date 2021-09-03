const httpStatus = require("http-status");
const Dao = require("../../dao");
const { digitize } = require("../../services/common.services");
const { initialInternalIdForBusinessForAdjustment } = require("../../enums");

async function getWastages(params) {
  try {
    const response = await Dao.StockAdjustment.findAndCountAll(params);
    if (response.count)
      return {
        success: httpStatus.OK,
        message: "Data Found",
        data: response.records,
        pages: Math.ceil(response.count / params.limit)
      };
    else return { success: httpStatus.OK, message: "Data not Found", data: [], count: response.count };
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
        adminId,
        internalIdForBusiness: initialInternalIdForBusinessForAdjustment
      }
      // { transaction }
    );

    const numberOfInternalIdForBusiness = digitize(adjustment.id, 6);
    adjustment.internalIdForBusiness = adjustment.internalIdForBusiness + numberOfInternalIdForBusiness;
    adjustment.save();

    params = await Promise.all(
      params.map(async param => {
        const { customerId, productId, warehouseId, adjustmentQuantity } = param;
        const inventory = await Dao.Inventory.findOne({ where: { customerId, productId, warehouseId } });
        inventory.availableQuantity -= adjustmentQuantity;
        inventory.save();
        param["inventoryId"] = inventory.id;
        param["adjustmentId"] = adjustment.id;
        return param;
      })
    );
    const inv = await Dao.AdjustmentInventory.bulkCreate(params);
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
    const stockAdjustment = await Dao.StockAdjustment.findOne(params);
    if (stockAdjustment) {
      let allProductsRemovedFromAdjustment = true;
      for (const body of req_body) {
        const { inventoryId } = body;
        const adjustmentInventories = await Dao.AdjustmentInventory.findOne({
          where: { adjustmentId: stockAdjustment.id, inventoryId }
        });
        if (body.adjustmentQuantity >= 0) {
          const inventory = await Dao.Inventory.findOne({ where: { id: inventoryId } });
          inventory.availableQuantity =
            body.availableQuantity + adjustmentInventories.adjustmentQuantity - body.adjustmentQuantity;
          adjustmentInventories.adjustmentQuantity = body.adjustmentQuantity;
          await inventory.save();
          if (body.adjustmentQuantity == 0) await adjustmentInventories.destroy();
          else allProductsRemovedFromAdjustment = false;
        }
        if (body.reason) adjustmentInventories.reason = body.reason;
        if (body.comment) adjustmentInventories.comment = body.comment;
        await adjustmentInventories.save();
        if (allProductsRemovedFromAdjustment) await stockAdjustment.destroy();
      }
      return { status: httpStatus.OK, message: "Data Updated", data: stockAdjustment };
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
      body = await Dao.StockAdjustment.delete(id);
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
