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
const {
  DISPATCH_ORDER: { STATUS },
} = require("../enums");
const digitize = (value, places) => {
  console.log(`value, places`, value, places);
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
  console.log(`modelUrl`, modelUrl);
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

    case "vehicle-types":
      MODEL = "Car";
  }
  console.log(`MODEL`, MODEL);
  return MODEL;
};

const addActivityLog = async (id, current, ActivityLog) => {
  // const modelUrl = req.originalUrl.split("/");
  // let MODEL = getModel(modelUrl[3]);
  // const sourceTypeId = (await ActivitySourceType.findOne({ where: { name: MODEL } })).id;
  // const source = await sourceModel[MODEL].findOne({ where: { id: req.params.id } });
  const log = await ActivityLog.update(
    {
      currentPayload: current,
    },
    id
  );
};

module.exports = { addActivityLog, getModel, digitize, checkOrderStatusAndUpdate };
