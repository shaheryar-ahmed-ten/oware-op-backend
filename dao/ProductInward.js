const CrudServiceDao = require("./crudService");

class ProductInward extends CrudServiceDao {
    constructor() {
        super("ProductInward");
    }
}

module.exports = new ProductInward();
