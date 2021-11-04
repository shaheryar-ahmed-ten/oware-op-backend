const { Op, or } = require("sequelize");
const {
  ActivityLog,
  Inventory,
  ProductOutward,
  OutwardGroup,
  ProductInward,
  OrderGroup,
  sequelize,
} = require("../models");
const models = require("../models");
// const Dao = require("../dao");
const {
  DISPATCH_ORDER: { STATUS },
} = require("../enums");
const digitize = (value, places) => {
  let strValue = value + "";
  return new Array(places - strValue.length).fill("0").join("") + strValue;
};

const sanitizeFilters = (whereClause, transform = {}) => {
  for (let item in whereClause) {
    if (whereClause[item] === "true") {
      whereClause[item] = true;
    } else if (whereClause[item] === "false") {
      whereClause[item] = false;
    }
    //disbaling integer complete search,uncomment to enable again
    // else if (!isNaN(Number(whereClause[item]))) {
    //   whereClause[item] = Number(whereClause[item]);
    // }
    if (typeof whereClause[item] === "string") {
      whereClause[item] = { [Op.like]: "%" + whereClause[item] + "%" };
    }
  }
  return whereClause;
};

const getMaxValueFromJson = (arr, prop) => {
  var max;
  for (var i = 0; i < arr.length; i++) {
    if (max == null || parseInt(arr[i][prop]) > parseInt(max[prop])) max = arr[i];
  }
  return max;
};

const modelWiseFilters = (filters, modelname) => {
  const filterObj = {};

  for (const key in filters) {
    // if(key.split(".")[1] != ('to' || 'from')){

    // }
    model = key.split(".")[0];
    if (filterObj[model] == undefined) {
      filterObj[model] = { [key.split(".")[1]]: filters[key] }; //if user model doesn't exist: users = {name:"shaheryar"}
    } else {
      filterObj[model][key.split(".")[1]] = filters[key]; //if user model exist: users.name = "shaheryar"
    }
  }

  let obj = Object.keys(filterObj)
    .map(function (key, index) {
      if (key == modelname) {
        return filterObj[key];
      }
    })
    .filter(function (x) {
      return x !== undefined;
    })[0];

  if (obj) {
    const { to, from } = obj;
    if (to && from) {
      obj = removeFromObject(obj, ["to", "from"])[0];
      obj["createdAt"] = {
        [Op.gte]: moment().set("hour", 0).set("minute", 0).set("second", 0),
        [Op.lte]: moment().set("hour", 0).set("minute", 0).set("second", 0),
      };
    }
    return obj;
  } else
    return {
      //include all elements
      id: {
        [Op.gt]: 0,
      },
    };
};

const attachDateFilter = (filters, query) => {
  const { to, from } = query;
  if (to && from) {
    createdAt = {
      [Op.gte]: moment(from).toISOString(),
      [Op.lte]: moment(to).add(1, "seconds").toISOString(),
    };
    filters["createdAt"] = createdAt;
  }
  return filters;
};

const removeFromObject = (obj, keys = []) => {
  if (Array.isArray(obj)) {
    return Object.assign([], obj).map((item) => {
      keys.forEach((key) => {
        if (item.hasOwnProperty(key)) {
          delete item[key];
        }
      });
      return item;
    });
  } else {
    return [Object.assign({}, obj)].map((item) => {
      keys.forEach((key) => {
        if (item.hasOwnProperty(key)) {
          delete item[key];
        }
      });
      return item;
    });
  }
};

const removeChildModelFilters = (where) => {
  for (const key in where) {
    if (key.includes(".")) delete where[key];
  }
  return where;
};

const checkOrderStatusAndUpdate = async (model, dispatchOrderId, currentOutwardQty, transaction) => {
  try {
    const order = await model.DispatchOrder.findOne({
      where: { id: dispatchOrderId },
      attributes: ["id", ["quantity", "orderQty"]],
      include: [
        {
          model: model.ProductOutward,
          attributes: ["id", ["quantity", "outwardQty"]],
        },
      ],
    });

    let orderStatus,
      totalOutwardQty = currentOutwardQty;
    for (const {
      dataValues: { outwardQty },
    } of order.ProductOutwards) {
      totalOutwardQty += outwardQty;
    }

    if (Number(order.dataValues.orderQty) === Number(totalOutwardQty)) orderStatus = STATUS.FULFILLED;
    else if (Number(order.dataValues.orderQty) > Number(totalOutwardQty) && Number(totalOutwardQty) > 0)
      orderStatus = STATUS.PARTIALLY_FULFILLED;
    order.status = orderStatus;
    await order.save({ transaction });
  } catch (err) {
    console.log("err", err);
    throw new Error(err);
  }
};

const getModel = (modelUrl) => {
  let myModel;
  switch (modelUrl) {
    case "inventory-wastages":
      myModel = "StockAdjustment";
      break;
    case "brand":
      myModel = "Brand";
      break;
    case "company":
      myModel = "Company";
      break;

    case "category":
      myModel = "Category";
      break;

    case "uom":
      myModel = "UOM";
      break;

    case "warehouse":
      myModel = "Warehouse";
      break;

    case "product":
      myModel = "Product";
      break;

    case "product-inward":
      myModel = "ProductInward";
      break;

    case "dispatch-order":
      myModel = "DispatchOrder";
      break;

    case "product-outward":
      myModel = "ProductOutward";
      break;

    case "inventory":
      myModel = "Inventory";
      break;

    case "driver":
      myModel = "Driver";
      break;

    case "vehicle":
      myModel = "Vehicle";
      break;
    case "user":
      myModel = "User";
      break;
    case "company":
      myModel = "Company";
      break;

    case "upload":
      myModel = "Upload";
      break;

    case "ride":
      myModel = "Ride";
      break;

    case "vehicle-types":
      myModel = "Car";
  }
  return myModel;
};

const addActivityLog = async (id, current, ActivityLog) => {
  // const modelUrl = req.originalUrl.split("/");
  // let MODEL = getModel(modelUrl[3]);
  // const sourceTypeId = (await ActivitySourceType.findOne({ where: { name: MODEL } })).id;
  // const source = await models[MODEL].findOne({ where: { id: req.params.id } });
  const log = await ActivityLog.update(
    {
      currentPayload: current,
    },
    id
  );
};

const addActivityLog2 = async (req, models) => {
  const modelUrl = req.originalUrl.split("/");
  console.log("modelUrl", modelUrl);
  let myModel = getModel(modelUrl[3]);
  if (modelUrl[4] == "VENDOR") myModel = "Vendor";
  const sourceTypeId = (await models.ActivitySourceType.findOne({ where: { name: myModel } })).id;
  if (req.method == "POST") {
    if (myModel == "Vendor") models[myModel] = "Company";
    const current = { ...req.body };
    let source;
    if (myModel == "Vendor") {
      source = await models["Company"].findOne({
        order: [["createdAt", "DESC"]],
        limit: 1,
        attributes: ["id"],
        paranoid: false,
      });
    } else {
      source = await models[myModel].findOne({
        order: [["createdAt", "DESC"]],
        limit: 1,
        attributes: ["id"],
        paranoid: false,
      });
    }
    source = source ? source.id + 1 : 1;
    if (myModel == "DispatchOrder" || myModel == "ProductOutward" || myModel == "ProductInward") {
      const numberOfInternalIdForBusiness = digitize(source, 6);
      if (!current.internalIdForBusiness) {
        current.internalIdForBusiness = (
          await models.Warehouse.findOne({
            where: { name: current.orders[0].warehouse },
            attributes: ["businessWarehouseCode"],
          })
        ).businessWarehouseCode;
        console.log("current", current);
      }
      current.internalIdForBusiness = current.internalIdForBusiness + numberOfInternalIdForBusiness;
      if (modelUrl[3] === "dispatch-order" && modelUrl[4] === "bulk") {
        current.internalIdForBusiness = "";
      }
    } else if (myModel == "StockAdjustment") {
      const numberOfInternalIdForBusiness = digitize(source, 6);
      current.internalIdForBusiness = initialInternalIdForBusinessForAdjustment + numberOfInternalIdForBusiness;
    } else if (myModel == "Ride") {
      current.internalIdForBusiness = digitize(source, 6);
    } else if (myModel == "User") {
      current["name"] = current["username"];
    }
    const log = await models.ActivityLog.create({
      userId: req.userId,
      currentPayload: current,
      previousPayload: {},
      sourceId: source,
      sourceType: sourceTypeId,
      activityType: "ADD",
    });
  } else if (req.method == "PUT") {
    if (myModel == "Vendor") models[myModel] = "Company";
    let source;
    if (myModel == "Vendor") {
      source = await models["Company"].findOne({ where: { id: req.params.id } });
    } else {
      source = await models[myModel].findOne({ where: { id: req.params.id } });
    }
    const log = await models.ActivityLog.create({
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
    if (myModel == "Vendor") {
      source = await models["Company"].findOne({ where: { id: req.params.id } });
    } else {
      source = await models[myModel].findOne({ where: { id: req.params.id } });
    }
    const log = await models.ActivityLog.create({
      userId: req.userId,
      currentPayload: {},
      previousPayload: source,
      sourceId: req.params.id,
      sourceType: sourceTypeId,
      activityType: "DELETE",
    });
  } else if (req.method == "PATCH") {
    const source = await models[myModel].findOne({ where: { id: req.params.id } });
    const log = await models.ActivityLog.create({
      userId: req.userId,
      currentPayload: {},
      previousPayload: source,
      sourceId: req.params.id,
      sourceType: sourceTypeId,
      activityType: "CANCEL",
    });
  }
};

const sendWhatsappAlert = async (receivingNum, text) => {
  const accountSid = process.env.WHATSAPP_SID;
  const authToken = process.env.WHATSAPP_AUTHID;
  const client = require("twilio")(accountSid, authToken);
  console.log("receivingNum", receivingNum);
  client.messages
    .create({
      body: text,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${receivingNum}`,
    })
    .then((message) => console.log(message.sid))
    .done();
};

module.exports = {
  addActivityLog,
  getModel,
  digitize,
  checkOrderStatusAndUpdate,
  getMaxValueFromJson,
  addActivityLog2,
  sendWhatsappAlert,
};
