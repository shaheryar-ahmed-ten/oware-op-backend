const httpStatus = require("http-status");
const Dao = require("../../dao");
const { digitize, addActivityLog } = require("../../services/common.services");

exports.getVehicleTypes = async (params) => {
  try {
    const response = await Dao.Car.findAndCountAll(params);
    if (response.count) {
      return {
        status: httpStatus.OK,
        success: true,
        message: "Data Found",
        data: response.records,
        pages: Math.ceil(response.count / params.limit),
      };
    } else return { success: false, status: httpStatus.OK, message: "Data not Found", data: [], count: response.count };
  } catch (err) {
    return {
      success: false,
      status: httpStatus.CONFLICT,
      message: err.message,
      code: "Failed to get data",
    };
  }
};

exports.getCarRelations = async (params) => {
  try {
    const carMakes = await Dao.CarMake.findAll(params);
    const carModels = await Dao.CarModel.findAll(params);
    const vehicleTypes = await Dao.VehicleType.findAll(params);
    const records = { carMakes, carModels, vehicleTypes };
    return {
      status: httpStatus.OK,
      success: true,
      message: "Data Found",
      data: records,
    };
  } catch (err) {
    return {
      success: false,
      status: httpStatus.CONFLICT,
      message: err.message,
      code: "Failed to get data",
    };
  }
};

exports.getVehicleTypeById = async (params) => {
  try {
    const response = await Dao.Car.findOne(params);
    if (response) return { success: true, status: httpStatus.OK, message: "Data Found", data: response };
    else return { status: httpStatus.OK, message: "Data not Found", data: [] };
  } catch (err) {
    return {
      success: false,
      message: err.message,
      code: "Failed to get data",
    };
  }
};

exports.addVehicleType = async (params, userId) => {
  try {
    const response = await Dao.Car.create({
      userId: userId,
      ...params, // req.body
    });
    if (response) return { success: true, status: httpStatus.OK, message: "Data Found", data: response };
    else return { status: httpStatus.OK, message: "Data not Found", data: [] };
  } catch (err) {
    return {
      success: false,
      message: err.message,
      code: "Failed to get data",
    };
  }
};

exports.deleteVehicleType = async (params) => {
  try {
    const response = await Dao.Car.delete(params);
    if (response) return { success: true, status: httpStatus.OK, message: "Record delete", data: response };
    else return { status: httpStatus.OK, message: "Data not Found", data: [] };
  } catch (err) {
    return {
      success: false,
      message: err.message,
      code: "Failed to get data",
    };
  }
};

exports.updateVehicleType = async (params, id, activityLogId) => {
  try {
    let response = await Dao.Car.update(params, id);
    await addActivityLog(activityLogId, response, Dao.ActivityLog);
    if (response) return { success: true, status: httpStatus.OK, message: "Vehicle type updated", data: response };
    else return { status: httpStatus.OK, message: "Data not Found", data: [] };
  } catch (err) {
    return {
      success: false,
      message: err.message,
      code: "Failed to get data",
    };
  }
};
