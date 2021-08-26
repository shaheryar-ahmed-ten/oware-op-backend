const models = require("../models");

class CrudServiceDao {
  constructor(modelName) {
    this.modelName = modelName;
    this.model = models[modelName];
  }

  async findOne(params) {
    const record = await this.model.findOne(params);
    return record;
  }

  async findAndCountAll(params) {
    const { offset, limit, sort, where } = params;
    let { includeAll = false, include, attributes } = params;
    const _params = { limit, offset, order: sort, where };
    if (includeAll) _params.include = [{ all: true }];
    if (include) _params.include = include;
    if (attributes) _params.attributes = attributes;
    const { count, rows } = await this.model.findAndCountAll(_params);
    if (!rows) return [];
    return { count, records: rows };
  }

  async findAll(params) {
    const { where } = params;
    let { includeAll = false, include, attributes } = params;
    const _params = { where };
    if (includeAll) _params.include = [{ all: true }];
    if (include) _params.include = include;
    if (attributes) _params.attributes = attributes;
    const { count, rows } = await this.model.findAndCountAll(_params);
    if (!rows) return [];
    return { count, records: rows };
  }

  async create(params) {
    console.log("this.model", this.model);
    const record = await this.model.create(params);
    return record;
  }

  async bulkCreate(params) {
    const record = await this.model.bulkCreate(params);
    return record;
  }

  async update(params, id) {
    let record1 = await this.model.findOne({
      where: { id: id, deletedAt: null }
    });
    if (record1) {
      record1 = await this.model.update(params, {
        where: { id: id },
        returning: true,
        plain: true
      });
      record1 = await this.model.findOne({
        where: { id: id, deletedAt: null }
      });
      return record1;
    } else return null;
  }

  async delete(id) {
    const record = await this.model.update(
      { deletedAt: new Date() },
      {
        where: { id: id },
        returning: true,
        plain: true
      }
    );
    return `deleted at id=${id}`;
  }

  async hardDelete(id) {
    const record = await this.model.destroy({ where: { id } });
  }

  async findByPk(id) {
    const record = await this.model.findByPk(id);
    return record ? record : null;
  }
}

module.exports = CrudServiceDao;
