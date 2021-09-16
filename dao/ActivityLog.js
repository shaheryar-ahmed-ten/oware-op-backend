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
    // let MODEL;
    // for (const row of rows) {
    //   MODEL = row.ActivitySourceType.name;
    //   let source;
    //   if (row.ActivitySourceType.hasInternalIdForBusiness) {
    //     // console.log(`row.sourceId`, row.sourceId, `sourceModel[MODEL]`, sourceModel[MODEL]);
    //     // source = await sourceModel[MODEL].findOne({
    //     //   where: { id: row.sourceId },
    //     //   attributes: ["internalIdForBusiness"],
    //     //   paranoid: false,
    //     // });
    //     // source = source.internalIdForBusiness;
    //   } else if (!row.ActivitySourceType.hasInternalIdForBusiness) {
    //     // console.log("row.sourceId", row.sourceId);
    //     // source = await sourceModel[MODEL].findOne({
    //     //   where: { id: row.sourceId },
    //     //   attributes: ["name"],
    //     //   paranoid: false,
    //     // });
    //     // source = source.name;
    //     // console.log("source", source);
    //   }
    //   row.dataValues["name"] = "";
    // }
    return { count, records: rows };
  }
}

module.exports = new ActivityLogDao();
