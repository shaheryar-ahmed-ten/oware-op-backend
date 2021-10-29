const { ActivityLog, ActivitySourceType, Warehouse } = require("../models");
const sourceModel = require("../models");
const { getModel, digitize } = require("../services/common.services");
const { initialInternalIdForBusinessForAdjustment } = require("../enums");

async function addActivityLog(req, res, next) {
  const modelUrl = req.originalUrl.split("/");
  let MODEL = getModel(modelUrl[3]);
  if (modelUrl[4] == "VENDOR") MODEL = "Vendor";
  const sourceTypeId = (await ActivitySourceType.findOne({ where: { name: MODEL } })).id;
  if (req.method == "POST") {
    if (MODEL == "Vendor") sourceModel[MODEL] = "Company";
    const current = { ...req.body };
    let source;
    if (MODEL == "Vendor") {
      source = await sourceModel["Company"].findOne({
        order: [["createdAt", "DESC"]],
        limit: 1,
        attributes: ["id"],
        paranoid: false,
      });
    } else {
      source = await sourceModel[MODEL].findOne({
        order: [["createdAt", "DESC"]],
        limit: 1,
        attributes: ["id"],
        paranoid: false,
      });
    }
    source = source ? source.id + 1 : 1;
    if (MODEL == "DispatchOrder" || MODEL == "ProductOutward" || MODEL == "ProductInward") {
      const numberOfInternalIdForBusiness = digitize(source, 6);
      if (!current.internalIdForBusiness) {
        console.log(
          `\n-----------------------------${current.orders[0].warehouse}----------------------------------\n`
        );
        current.internalIdForBusiness = (
          await Warehouse.findOne({
            where: { name: current.orders[0].warehouse },
            attributes: ["businessWarehouseCode"],
          })
        ).businessWarehouseCode;
      }
      current.internalIdForBusiness = current.internalIdForBusiness + numberOfInternalIdForBusiness;
      if (current && current.orders && current.orders.length) current.internalIdForBusiness = "";
    } else if (MODEL == "StockAdjustment") {
      const numberOfInternalIdForBusiness = digitize(source, 6);
      current.internalIdForBusiness = initialInternalIdForBusinessForAdjustment + numberOfInternalIdForBusiness;
    } else if (MODEL == "Ride") {
      current.internalIdForBusiness = digitize(source, 6);
    } else if (MODEL == "User") {
      current["name"] = current["username"];
    }
    const log = await ActivityLog.create({
      userId: req.userId,
      currentPayload: current,
      previousPayload: {},
      sourceId: source,
      sourceType: sourceTypeId,
      activityType: "ADD",
    });
  } else if (req.method == "PUT") {
    if (MODEL == "Vendor") sourceModel[MODEL] = "Company";
    let source;
    if (MODEL == "Vendor") {
      source = await sourceModel["Company"].findOne({ where: { id: req.params.id } });
    } else {
      source = await sourceModel[MODEL].findOne({ where: { id: req.params.id } });
    }
    const log = await ActivityLog.create({
      userId: req.userId,
      currentPayload: {},
      previousPayload: source,
      sourceId: req.params.id,
      sourceType: sourceTypeId,
      activityType: "EDIT",
    });
    req["activityLogId"] = log.id;
  } else if (req.method == "DELETE") {
    let source;
    if (MODEL == "Vendor") {
      source = await sourceModel["Company"].findOne({ where: { id: req.params.id } });
    } else {
      source = await sourceModel[MODEL].findOne({ where: { id: req.params.id } });
    }
    const log = await ActivityLog.create({
      userId: req.userId,
      currentPayload: {},
      previousPayload: source,
      sourceId: req.params.id,
      sourceType: sourceTypeId,
      activityType: "DELETE",
    });
  } else if (req.method == "PATCH") {
    const source = await sourceModel[MODEL].findOne({ where: { id: req.params.id } });
    const log = await ActivityLog.create({
      userId: req.userId,
      currentPayload: {},
      previousPayload: source,
      sourceId: req.params.id,
      sourceType: sourceTypeId,
      activityType: "CANCEL",
    });
  }
  next();
}

module.exports = addActivityLog;
