const CrudServiceDao = require("./crudService");

class ProductOutward extends CrudServiceDao {
  constructor() {
    super("ProductOutward");
  }
}

module.exports = new ProductOutward();
