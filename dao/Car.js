const CrudServiceDao = require("./crudService");

class Car extends CrudServiceDao {
    constructor() {
        super("Car");
    }
}

module.exports = new Car();
