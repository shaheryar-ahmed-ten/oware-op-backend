const httpStatus = require('http-status');
const Dao = require('../../dao');
const { Car } = require('../../models')

exports.getVehicleTypes = async (params) => {
    try {
        const response = await Dao.Car.findAndCountAll(params);
        if (response.count) {
            return {
                status: httpStatus.OK,
                success: true,
                message: "Data Found",
                data: response.records,
                pages: Math.ceil(response.count / params.limit)
            };
        }
        else return { success: false, status: httpStatus.OK, message: "Data not Found", data: [], count: response.count };
    }
    catch (err) {
        console.log("ERROR:", err);
        return {
            success: false,
            status: httpStatus.CONFLICT,
            message: err.message,
            code: "Failed to get data"
        };
    }
}


exports.getVehicleTypeById = async (params) => {
    try {
        const response = await Dao.Car.findOne(params);
        if (response) return { success: false, status: httpStatus.OK, message: "Data Found", data: response };
        else return { status: httpStatus.OK, message: "Data not Found", data: [] };
    } catch (err) {
        console.log("ERROR:", err);
        return {
            success: false,
            message: err.message,
            code: "Failed to get data"
        };
    }
}

exports.addVehicleType = async (params, adminId) => {
    try {
        const vehicleType = await VehicleType.create(
            {
                adminId,
            }

        )
    } catch (err) {
        console.log("ERROR:", err);
        return {
            success: false,
            message: err.message,
            code: "Failed to get data"
        };
    }
}