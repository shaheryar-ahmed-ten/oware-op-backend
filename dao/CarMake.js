const CrudServiceDao = require("./crudService");

class CarMake extends CrudServiceDao {
    constructor() {
        super("CarMake");
    }
}

module.exports = new CarMake();
