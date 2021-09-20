const CrudServiceDao = require("./crudService");

class CarModel extends CrudServiceDao {
    constructor() {
        super("CarModel");
    }
}

module.exports = new CarModel();
