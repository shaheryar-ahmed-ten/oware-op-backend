const httpStatus = require("http-status");
const Dao = require("../../Dao");

async function getWastages(params) {
  try {
    const records = await Dao.WarehouseWastage.findAndCountAll(params);
    if (records.count) return { status: httpStatus.OK, message: "Data Found", data: records };
    else return { status: httpStatus.OK, message: "Data not Found", data: null };
  } catch (err) {
    console.log("ERROR:", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to get data" };
  }
}

async function addWastages(params) {
  try {
    // const isValid = await AddValidation.validateAsync(params);
    // if (isValid) {

    data = await Dao.WarehouseWastage.create(params);
    return { status: httpStatus.OK, message: "Wastages added", data: data };
    // } else {
    //   return { status: httpStatus.UNPROCESSABLE_ENTITY, message: isValid, code: "save token failed" };
    // }
  } catch (err) {
    console.log("ERROR:", err);
    return { status: httpStatus.CONFLICT, message: err.message, code: "Failed to add Wastages" };
  }
}

module.exports = { getWastages, addWastages };
