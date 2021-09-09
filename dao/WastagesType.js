const CrudServiceDao = require("./crudService");

class WastagesTypeDao extends CrudServiceDao {
  constructor() {
    super("WastagesType");
  }
}

module.exports = new WastagesTypeDao();
