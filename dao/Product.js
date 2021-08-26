const CrudServiceDao = require("./crudService");

class ProductDao extends CrudServiceDao {
  constructor() {
    super("Product");
  }
}

module.exports = new ProductDao();
