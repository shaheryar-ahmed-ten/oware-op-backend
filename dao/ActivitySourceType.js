const CrudServiceDao = require("./crudService");

class ActivitySourceType extends CrudServiceDao {
  constructor() {
    super("ActivitySourceType");
  }
}

module.exports = new ActivitySourceType();
