const express = require("express");
const router = express.Router();
const {
  Ride,
  RideProduct,
  User,
  Vehicle,
  Driver,
  Company,
  City,
  Category,
  Car,
  CarModel,
  CarMake,
  VehicleType,
  File,
} = require("../models");
const config = require("../config");
const { Op } = require("sequelize");
const RIDE_STATUS = require("../enums/rideStatus");
const { RELATION_TYPES, RIDE_WHATSAPP_ALERT } = require("../enums");
const { digitize, addActivityLog } = require("../services/common.services");
const ExcelJS = require("exceljs");
const authService = require("../services/auth.service");
const moment = require("moment-timezone");
const { previewFile } = require("../services/s3.service");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const { sendWhatsappAlert } = require("../services/common.services");

/* GET rides listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search)
    where[Op.or] = [
      // "pickupAddress",
      // "dropoffAddress",
      // "$Vehicle.Car.CarModel.name$",
      "$Vehicle.registrationNumber$",
      "id",
      "$Customer.name$",
      "$Driver.Vendor.name$",
      "$Driver.name$",
    ].map((key) => ({ [key]: { [Op.like]: "%" + req.query.search + "%" } }));

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  }
  if (req.query.start && req.query.end) {
    const startingDate = moment(req.query.start);
    const endingDate = moment(req.query.end).set({
      hour: 23,
      minute: 53,
      second: 59,
      millisecond: 0,
    });
    where["createdAt"] = { [Op.between]: [startingDate, endingDate] };
  }

  if (req.query.status) where["status"] = req.query.status;
  // if (req.query.searchstatus) where["status"] = req.query.searchstatus;

  const response = await Ride.findAndCountAll({
    distinct: true,
    // subQuery: false,
    include: [
      {
        model: Company,
        as: "Customer",
        required: true,
      },
      {
        model: File,
        as: "Manifest",
      },
      {
        model: RideProduct,
        include: [Category],
      },
      // {
      //   model: Area,
      //   include: [{ model: Zone, include: [City] }],
      //   as: "PickupArea",
      //   required: true,
      // },
      // {
      //   model: Area,
      //   include: [{ model: Zone, include: [City] }],
      //   as: "DropoffArea",
      //   required: true,
      // },
      {
        model: Vehicle,
        include: [
          {
            model: Company,
            as: "Vendor",
            required: true,
          },
          {
            model: Car,
            include: [{ model: CarModel, required: true }, CarMake, VehicleType],
            required: true,
          },
        ],
        required: true,
      },
      {
        model: Driver,
        include: [{ model: Company, as: "Vendor", required: true }],
        required: true,
      },
      {
        model: City,
        as: "pickupCity",
      },
      {
        model: City,
        as: "dropoffCity",
      },
    ],
    order: [["updatedAt", "DESC"]],
    where,
    limit,
    offset,
  });
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
    count: response.count,
  });
});

// Get single ride
router.get("/single/:id", async (req, res, next) => {
  let ride = await Ride.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Company,
        as: "Customer",
      },
      {
        model: File,
        as: "Manifest",
      },
      {
        model: RideProduct,
        include: [Category],
      },
      {
        model: Vehicle,
        include: [
          {
            model: Company,
            as: "Vendor",
          },
          {
            model: Car,
            include: [CarModel, CarMake, VehicleType],
          },
        ],
      },
      {
        model: Driver,
        include: [{ model: Company, as: "Vendor" }],
      },
      {
        model: City,
        as: "pickupCity",
      },
      {
        model: City,
        as: "dropoffCity",
      },
    ],
  });
  if (!ride)
    return res.status(400).json({
      success: false,
      message: "No ride found!",
    });
  res.status(200).json({
    success: true,
    message: "Data found!",
    data: ride,
  });
});

// get ride product manifest
router.get("/preview/:id", async (req, res, next) => {
  const id = req.params.id;
  let file = await File.findOne({ where: { id } });
  let preview = await previewFile(file.bucket, file.key);
  res.json({ preview });
});
/* POST create new ride. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New ride registered";
  let ride;
  let products = req.body.products;
  delete req.body.products;
  try {
    req.body["pickupDate"] = new Date(moment(req.body["pickupDate"]).tz("Africa/Abidjan"));
    req.body["dropoffDate"] = new Date(moment(req.body["dropoffDate"]).tz("Africa/Abidjan"));
    new Date().toISOString();
    ride = await Ride.create({
      userId: req.userId,
      ...req.body,
    });
    products = await RideProduct.bulkCreate(
      products.map((product) => ({
        userId: req.userId,
        ...product,
        rideId: ride.id,
      }))
    );
    ride.internalIdForBusiness = digitize(ride.id, 6);
    ride.save();
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
  res.json({
    success: true,
    message,
    data: ride,
  });
});

/* PUT update existing ride. */
router.put("/:id", activityLog, async (req, res, next) => {
  let ride = await Ride.findOne({
    where: { id: req.params.id },
    include: [
      RideProduct,
      "Customer",
      Driver,
      { model: Vehicle, include: [{ model: Car, include: [CarMake, CarModel] }] },
    ],
  });
  const initialRideStatus = ride.status;
  if (!ride)
    return res.status(400).json({
      success: false,
      message: "No ride found!",
    });
  ride.vehicleId = req.body.vehicleId;
  ride.customerId = req.body.customerId;
  ride.driverId = req.body.driverId;
  ride.pickupDate = req.body.pickupDate;
  ride.dropoffDate = req.body.dropoffDate;
  ride.pickupAddress = req.body.pickupAddress;
  ride.manifestId = req.body.manifestId;
  ride.dropoffAddress = req.body.dropoffAddress;
  ride.cancellationReason = req.body.cancellationReason;
  ride.cancellationComment = req.body.cancellationComment;
  ride.status = req.body.status;
  ride.price = req.body.price;
  ride.cost = req.body.cost;
  if (req.body.hasOwnProperty("customerDiscount")) ride.customerDiscount = req.body.customerDiscount;
  if (req.body.hasOwnProperty("driverIncentive")) ride.driverIncentive = req.body.driverIncentive;
  ride.memo = req.body.memo;
  if (req.body.hasOwnProperty("pickupLocation")) ride.pickupLocation = req.body.pickupLocation;
  if (req.body.hasOwnProperty("dropoffLocation")) ride.dropoffLocation = req.body.dropoffLocation;
  ride.weightCargo = req.body.weightCargo;
  ride.pocName = req.body.pocName;
  ride.pocNumber = req.body.pocNumber;
  ride.eta = req.body.eta;
  ride.completionTime = req.body.completionTime;
  ride.eirId = req.body.eirId;
  ride.builtyId = req.body.builtyId;
  ride.currentLocation = req.body.currentLocation;

  let newProducts = req.body.products.filter((product) => !product.id);
  const oldProductIds = req.body.products.filter((product) => product.id).map((product) => product.id);
  const deletedProductIds = ride.RideProducts.filter((product) => oldProductIds.indexOf(product.id) < 0).map(
    (product) => product.id
  );

  await RideProduct.destroy({ where: { id: { [Op.in]: deletedProductIds } } });
  await RideProduct.bulkCreate(
    newProducts.map((product) => ({
      userId: req.userId,
      categoryId: product.categoryId,
      name: product.name,
      quantity: product.quantity,
      rideId: ride.id,
    }))
  );

  try {
    const response = await ride.save();
    await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
    return res.json({
      success: true,
      message: "Ride updated",
      data: response,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
});

router.delete("/:id", activityLog, async (req, res, next) => {
  let response = await Ride.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "Ride deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No ride found!",
    });
});

router.get("/relations", async (req, res, next) => {
  let where = { isActive: true };
  const vehicles = await Vehicle.findAll({ where, include: [Driver] });
  const drivers = await Driver.findAll({ where });
  const cities = await City.findAll({ where });
  const companies = await Company.findAll({ where: { ...where, relationType: RELATION_TYPES.CUSTOMER } });
  const productCategories = await Category.findAll({ where });
  const vendors = await Dao.Company.findAll({
    where: { ...where, relationType: RELATION_TYPES.VENDOR },
    include: [
      {
        model: Vehicle,
        include: [{ model: Car, include: [{ model: CarMake }, { model: CarModel }] }],
        as: "Vehicles",
      },
      { model: Driver, as: "Drivers" },
    ],
  });
  const cars = await Vehicle.findAll({
    where,
    include: [
      { model: Car, include: [{ model: CarMake }, { model: CarModel }] },
      { model: Company, where: { relationType: RELATION_TYPES.VENDOR }, as: "Vendor", require: true },
    ],
  });

  const statuses = RIDE_STATUS;
  res.json({
    success: true,
    message: "respond with a resource",
    vehicles,
    drivers,
    statuses,
    cities,
    companies,
    vendors,
    cars,
    productCategories,
  });
});

router.get("/stats", async (req, res) => {
  const stats = [
    {
      key: "ALL",
      label: "All",
      value: await Ride.aggregate("id", "count"),
    },
  ];
  let statusList = Object.keys(RIDE_STATUS);
  for (let index in statusList) {
    let status = statusList[index];
    stats.push({
      key: status,
      label: RIDE_STATUS[status],
      value: await Ride.aggregate("id", "count", { where: { status } }),
    });
  }
  return res.json({
    success: true,
    stats,
  });
});

// get excel export
router.get("/export", async (req, res, next) => {
  let where = {};
  if (!authService.isSuperAdmin(req)) where["$Company.contactId$"] = req.userId;

  let workbook = new ExcelJS.Workbook();

  let worksheet = workbook.addWorksheet("Rides");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({ header: column, width: Math.ceil(column.length * 1.5), outlineLevel: 1 }));

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where["createdAt"] = { [Op.between]: [previousDate, currentDate] };
  }

  if (req.query.start || req.query.end) {
    const startingDate = moment(req.query.start);
    const endingDate = moment(req.query.end).set({
      hour: 23,
      minute: 53,
      second: 59,
      millisecond: 0,
    });
    where["createdAt"] = { [Op.between]: [startingDate, endingDate] };
  }

  if (req.query.status) where["status"] = req.query.status;

  let response = await Dao.Ride.findAll({
    include: [
      {
        model: Company,
        as: "Customer",
      },
      {
        model: File,
        as: "Manifest",
      },
      {
        model: RideProduct,
        include: [Category],
      },
      {
        model: Vehicle,
        include: [
          {
            model: Company,
            as: "Vendor",
          },
          {
            model: Car,
            include: [CarModel, CarMake, VehicleType],
          },
        ],
        // attributes:["registrationNumber"]
      },
      {
        model: Driver,
        include: [{ model: Company, as: "Vendor" }],
      },
      {
        model: City,
        as: "pickupCity",
      },
      {
        model: City,
        as: "dropoffCity",
      },
    ],
    order: [["updatedAt", "DESC"]],
    where,
  });

  worksheet.columns = getColumnsConfig([
    "RIDE ID",
    "STATUS",
    "COMPANY",
    "VENDOR",
    "VEHICLE TYPE",
    "DRIVER",
    "VEHICLE",
    "CUSTOMER PRICE",
    "VENDOR COST",
    "CUSTOMER DISCOUNT",
    "DRIVER INCENTIVE",
    "PICKUP CITY",
    "PICKUP ADDRESS",
    "PICKUP DATE",
    "DROPOFF CITY",
    "DROPOFF ADDRESS",
    "DROPOFF DATE",
    "CREATED DATE",
    "UPDATED DATE",
    "POC NAME",
    "POC NUMBER",
    "ETA(MINUTES)",
    "TRIP COMPLETION TIME(MINUTES)",
    "CURRENT LOCATION",
    "WEIGHT OF CARGO(KG)",
    "MEMO",
  ]);

  worksheet.addRows(
    response.map((row) => [
      row.id,
      row.status,
      row.Customer.name,
      row.Driver.Vendor.name,
      row.Vehicle.Car.CarMake.name + " " + row.Vehicle.Car.CarModel.name,
      row.Driver.name,
      row.Vehicle.registrationNumber,
      row.price,
      row.cost,
      row.customerDiscount,
      row.driverIncentive,
      row.pickupCity.name,
      row.pickupAddress,
      moment(row.pickupDate).tz(req.query.client_Tz).format("DD/MM/yy h:mm A"),
      row.dropoffCity.name,
      row.dropoffAddress,
      moment(row.dropoffDate).tz(req.query.client_Tz).format("DD/MM/yy h:mm A"),
      moment(row.createdAt).tz(req.query.client_Tz).format("DD/MM/yy h:mm A"),
      moment(row.updatedAt).tz(req.query.client_Tz).format("DD/MM/yy h:mm A"),
      row.pocName,
      row.pocNumber,
      row.eta !== null && row.eta !== 0 ? row.eta / 60 : 0,
      row.completionTime !== null && row.completionTime !== 0 ? row.completionTime / 60 : 0,
      row.currentLocation,
      row.weightCargo,
      row.memo,
    ])
  );

  // separate sheet for product details
  worksheet = workbook.addWorksheet("Product Details");

  worksheet.columns = getColumnsConfig(["RIDE ID", "CATEGORY", "PRODUCT NAME", "QUANTITY"]);

  response.map((row) => {
    worksheet.addRows(
      row.RideProducts.map((product) => [row.id, product.Category.name, product.name, product.quantity])
    );
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});

module.exports = router;
