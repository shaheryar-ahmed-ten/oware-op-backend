const httpStatus = require('http-status');
const { VehicleType } = require('../../models')

exports.getVehicleTypes = async (params) => {
    try {
        const response = await VehicleType.findAndCountAll(params);
        if (response.count) {
            return {
                success: true,
                message: "Data Found",
                data: response.rows,
                pages: Math.ceil(response.count / params.limit)
            };
        }
        else return { success: false, message: "Data not Found", data: [], count: response.count };
    }
    catch (err) {
        console.log("ERROR:", err);
        return {
            success: false,
            message: err.message,
            code: "Failed to get data"
        };
    }
}