const httpStatus = require("http-status");
const Dao = require("../../dao");
const { digitize } = require("../../services/common.services");
const { initialInternalIdForBusinessForAdjustment } = require("../../enums");
// const { StockAdjustment } = require("../../models");

async function getActivityLogs(params) {
  try {
    const response = await Dao.ActivityLog.findAndCountAll(params);
    if (response.count)
      return {
        success: httpStatus.OK,
        message: "Data Found",
        data: response.records,
        pages: Math.ceil(response.count / params.limit),
      };
    else return { success: httpStatus.OK, message: "Data not Found", data: [], count: response.count };
  } catch (err) {
    console.log("ERROR:", err);
    return {
      success: httpStatus.CONFLICT,
      message: err.message,
      code: "Failed to get data",
    };
  }
}

module.exports = {
  getActivityLogs,
};
