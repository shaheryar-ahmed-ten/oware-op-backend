const CrudServiceDao = require("./crudService");

class VehicleType extends CrudServiceDao {
    constructor() {
        super("VehicleType");
    }
}

module.exports = new VehicleType();
