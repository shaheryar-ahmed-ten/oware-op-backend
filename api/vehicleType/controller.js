const httpStatus = require('http-status');
const { VehicleType } = require('../../models')

exports.getVehicleTypes = async (params) => {
    try {
        const response = await VehicleType.findAndCountAll(params);
        if (response.count) {
            return {
                status: httpStatus.OK,
                success: true,
                message: "Data Found",
                data: response.rows,
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
        const response = await VehicleType.findOne(params);
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