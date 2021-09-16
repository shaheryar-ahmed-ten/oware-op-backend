const CrudServiceDao = require("./crudService");
const sourceModel = require("../models");

class ActivityLogDao extends CrudServiceDao {
  constructor() {
    super("ActivityLog");
  }
  async findAndCountAll(params) {
    const { offset, limit, sort, where } = params;
    let { includeAll = false, include, attributes } = params;
    const _params = { limit, offset, order: sort, where, distinct: true };
    if (includeAll) _params.include = [{ all: true }];
    if (include) _params.include = include;
    if (attributes) _params.attributes = attributes;
    const { count, rows } = await this.model.findAndCountAll(_params);
    if (!rows) return [];
    let MODEL;
    for (const row of rows) {
      MODEL = row.ActivitySourceType.name;
      // const sourceTypeId = (await ActivitySourceType.findOne({ where: { name: MODEL } })).id;
      console.log(`sourceModel[MODEL]`, sourceModel[MODEL]);
      console.log(`row.sourceId`, row.sourceId);
      let source;
      if (row.ActivitySourceType.hasInternalIdForBusiness) {
        source = await sourceModel[MODEL].findOne({
          where: { id: row.sourceId },
          attributes: ["internalIdForBusiness"],
        });
        source = source.internalIdForBusiness;
      } else if (row.ActivitySourceType.name) {
        source = (await sourceModel[MODEL].findOne({ where: { id: row.sourceId }, attributes: ["name"] })).name;
        source = source.name;
      }
      row["name"] = source;
      console.log(`row["name"]`, row["name"]);
      console.log("row", row);
    }
    return { count, records: rows };
  }
}

module.exports = new ActivityLogDao();
