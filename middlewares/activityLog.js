const { ActivityLog, ActivitySourceType } = require("../models");
const sourceModel = require("../models");

async function addActivityLog(req, res, next) {
  const modelUrl = req.originalUrl.split("/");
  let MODEL = getModel(modelUrl[3]);
  const sourceTypeId = (await ActivitySourceType.findOne({ where: { name: MODEL } })).id;
  if (req.method == "POST") {
    if (MODEL != "Upload") {
      const source = (
        await sourceModel[MODEL].findOne({ order: [["createdAt", "DESC"]], limit: 1, attributes: ["id"] })
      ).id;
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: req.body,
        previousPayload: null,
        sourceId: source ? source + 1 : 1,
        sourceType: sourceTypeId,
        activityType: "ADD",
      });
    } else {
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: req.body,
        previousPayload: null,
        sourceId: null,
        sourceType: sourceTypeId,
        activityType: "ADD",
      });
    }
  } else if (req.method == "PUT") {
    if (MODEL != "Upload") {
      const source = await sourceModel[MODEL].findOne({ order: [["createdAt", "DESC"]], limit: 1 });
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: req.body,
        previousPayload: source,
        sourceId: req.params.id,
        sourceType: sourceTypeId,
        activityType: "EDIT",
      });
    } else {
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: req.body,
        previousPayload: null,
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
        currentPayload: null,
        previousPayload: source,
        sourceId: req.params.id,
        sourceType: sourceTypeId,
        activityType: "DELETE",
      });
    } else {
      const log = await ActivityLog.create({
        userId: req.userId,
        currentPayload: null,
        previousPayload: null,
        sourceId: req.params.id,
        sourceType: sourceTypeId,
        activityType: "DELETE",
      });
    }
  }
  next();
}

function getModel(modelUrl) {
  let MODEL;
  switch (modelUrl) {
    case "inventory-wastages":
      MODEL = "StockAdjustment";
      break;
    case "brand":
      MODEL = "Brand";
      break;
    case "company":
      MODEL = "Company";
      break;

    case "category":
      MODEL = "Category";
      break;

    case "uom":
      MODEL = "UOM";
      break;

    case "warehouse":
      MODEL = "Warehouse";
      break;

    case "product":
      MODEL = "Product";
      break;

    case "product-inward":
      MODEL = "ProductInward";
      break;

    case "dispatch-order":
      MODEL = "DispatchOrder";
      break;

    case "product-outward":
      MODEL = "ProductOutward";
      break;

    case "inventory":
      MODEL = "Inventory";
      break;

    case "driver":
      MODEL = "Driver";
      break;

    case "vehicle":
      MODEL = "Vehicle";
      break;
    case "user":
      MODEL = "User";
      break;
    case "company":
      MODEL = "Company";
      break;

    case "upload":
      MODEL = "Upload";
      break;

    case "ride":
      MODEL = "Ride";
  }
  console.log(`MODEL`, MODEL);
  return MODEL;
}

module.exports = addActivityLog;
