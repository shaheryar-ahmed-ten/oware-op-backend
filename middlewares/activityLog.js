const { ActivityLog, ActivitySourceType } = require("../models");
const sourceModel = require("../models");
const { getModel, digitize } = require("../services/common.services");
const { initialInternalIdForBusinessForAdjustment } = require("../enums");

async function addActivityLog(req, res, next) {
  const modelUrl = req.originalUrl.split("/");
  let MODEL = getModel(modelUrl[3]);
  const sourceTypeId = (await ActivitySourceType.findOne({ where: { name: MODEL } })).id;
  if (req.method == "POST") {
    const current = { ...req.body };
    if (MODEL != "Upload") {
      let source = await sourceModel[MODEL].findOne({ order: [["createdAt", "DESC"]], limit: 1, attributes: ["id"] });
      source = source ? source.id + 1 : 1;
      if (MODEL == "DispatchOrder" || MODEL == "ProductOutward" || MODEL == "ProductInward") {
        const numberOfInternalIdForBusiness = digitize(source, 6);
        current.internalIdForBusiness = current.internalIdForBusiness + numberOfInternalIdForBusiness;
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
    } else {
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: req.body,
        previousPayload: {},
        sourceId: null,
        sourceType: sourceTypeId,
        activityType: "ADD",
      });
    }
  } else if (req.method == "PUT") {
    if (MODEL != "Upload") {
      const source = await sourceModel[MODEL].findOne({ where: { id: req.params.id } });
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: {},
        previousPayload: source,
        sourceId: req.params.id,
        sourceType: sourceTypeId,
        activityType: "EDIT",
      });
      req["activityLogId"] = log.id;
    } else {
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: req.body,
        previousPayload: {},
        sourceId: null,
        sourceType: sourceTypeId,
        activityType: "PUT",
      });
    }
  } else if (req.method == "DELETE") {
    if (MODEL != "Upload") {
      const source = await sourceModel[MODEL].findOne({ order: [["createdAt", "DESC"]], limit: 1 });
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: {},
        previousPayload: source,
        sourceId: req.params.id,
        sourceType: sourceTypeId,
        activityType: "DELETE",
      });
    } else {
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: {},
        previousPayload: {},
        sourceId: req.params.id,
        sourceType: sourceTypeId,
        activityType: "DELETE",
      });
    }
  }
  next();
}

module.exports = addActivityLog;
