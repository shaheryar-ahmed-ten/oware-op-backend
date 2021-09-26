const CrudServiceDao = require("./crudService");

class Category extends CrudServiceDao {
  constructor() {
    super("Category");
  }
}

module.exports = new Category();
