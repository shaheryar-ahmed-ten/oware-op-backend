const httpStatus = require("http-status");
const Dao = require("../../dao");
const { digitize } = require("../../services/common.services");
const { initialInternalIdForBusinessForAdjustment } = require("../../enums");
// const { StockAdjustment } = require("../../models");

async function getActivityLogs(params) {
  try {
    const response = await Dao.ActivityLog.findAndCountAll(params);
    if (response.count) {
      for (const { dataValues } of response.records) {
        // console.log("dataValues", dataValues);
        // console.log(`dataValues.currentPayload.relationType`, dataValues.currentPayload.relationType);
        if (dataValues.currentPayload.relationType == "VENDOR") {
          console.log("---debug---");
          dataValues.ActivitySourceType.name = "Vendor";
        }
        if (
          dataValues.currentPayload.makeId &&
          dataValues.currentPayload.modelId &&
          dataValues.currentPayload.vehicleTypeId
        ) {
          dataValues.ActivitySourceType.name = "VehicleType";
          // const car = await Dao.Car.findOne({
          //   where: {
          //     makeId: dataValues.currentPayload.makeId,
          //     modelId: dataValues.currentPayload.modelId,
          //     vehicleTypeId: dataValues.currentPayload.vehicleTypeId,
          //   },
          // });
          // console.log("Car", car);
          const carmake = (
            await Dao.CarMake.findOne({
              where: {
                id: dataValues.currentPayload.makeId,
              },
              attributes: ["name"],
            })
          ).name;
          const carmodel = (
            await Dao.CarModel.findOne({
              where: {
                id: dataValues.currentPayload.modelId,
              },
              attributes: ["name"],
            })
          ).name;
          console.log("carmake", carmake, "carmodel", carmodel);
          dataValues.currentPayload.name = `${carmake} carmodel`;
        }
      }
      return {
        success: httpStatus.OK,
        message: "Data Found",
        data: response.records,
        pages: Math.ceil(response.count / params.limit),
      };
    } else return { success: httpStatus.OK, message: "Data not Found", data: [], count: response.count };
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
