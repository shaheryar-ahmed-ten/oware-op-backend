const express = require("express");
const router = express.Router();
const {
  Ride,
  RideProduct,
  User,
  Vehicle,
  Driver,
  Company,
  Area,
  Zone,
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
const { RELATION_TYPES } = require("../enums");
const { digitize, addActivityLog } = require("../services/common.services");
const ExcelJS = require("exceljs");
const authService = require("../services/auth.service");
const moment = require("moment-timezone");
const { previewFile } = require("../services/s3.service");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");

/* GET rides listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {};
  if (req.query.search)
    where[Op.or] = [
      "$PickupArea.name$",
      "$DropoffArea.name$",
      "pickupAddress",
      "dropoffAddress",
      "$Vehicle.Car.CarModel.name$",
      "$Vehicle.registrationNumber$",
      "id",
      "$Customer.name$",
      "$Driver.Vendor.name$",
      "$Driver.name$",
    ].map((key) => ({ [key]: { [Op.like]: "%" + req.query.search + "%" } }));
  if (req.query.status) where["status"] = req.query.status;
  const response = await Ride.findAndCountAll({
    distinct: true,
    subQuery: false,
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
        model: Area,
        include: [{ model: Zone, include: [City] }],
        as: "PickupArea",
      },
      {
        model: Area,
        include: [{ model: Zone, include: [City] }],
        as: "DropoffArea",
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
    pages: Math.ceil(response.count/limit),
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
        model: Area,
        include: [{ model: Zone, include: [City] }],
        as: "PickupArea",
      },
      {
        model: Area,
        include: [{ model: Zone, include: [City] }],
        as: "DropoffArea",
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
  console.log("req.params.id", req.params.id);
  const id = req.params.id;
  let file = await File.findOne({ where: { id } });
  let preview = await previewFile(file.bucket, file.key);
  console.log("preview", preview);
  res.json({ preview });
});
/* POST create new ride. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New ride registered";
  let ride;
  let products = req.body.products;
  delete req.body.products;
  try {
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
    include: [RideProduct],
  });
  if (!ride)
    return res.status(400).json({
      success: false,
      message: "No ride found!",
    });
  ride.vehicleId = req.body.vehicleId;
  ride.driverId = req.body.driverId;
  ride.pickupDate = req.body.pickupDate;
  ride.dropoffDate = req.body.dropoffDate;
  ride.pickupAreaId = req.body.pickupAreaId;
  ride.pickupAddress = req.body.pickupAddress;
  ride.manifestId = req.body.manifestId;
  // ride.internalIdForBusiness = req.body.internalIdForBusiness;
  ride.dropoffAreaId = req.body.dropoffAreaId;
  ride.dropoffAddress = req.body.dropoffAddress;
  ride.cancellationReason = req.body.cancellationReason;
  ride.cancellationComment = req.body.cancellationComment;
  ride.status = req.body.status;
  ride.price = req.body.price;
  ride.cost = req.body.cost;
  ride.customerDiscount = req.body.customerDiscount;
  ride.driverIncentive = req.body.driverIncentive;

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
  const areas = await Area.findAll({ where, include: [{ model: Zone, include: [City] }] });
  const zones = await Zone.findAll({ where });
  const cities = await City.findAll({ where, include: [{ model: Zone, include: [Area] }] });
  const companies = await Company.findAll({ where: { ...where, relationType: RELATION_TYPES.CUSTOMER } });
  const productCategories = await Category.findAll({ where });
  const statuses = RIDE_STATUS;
  res.json({
    success: true,
    message: "respond with a resource",
    vehicles,
    drivers,
    statuses,
    cities,
    zones,
    areas,
    companies,
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

  let response = await Ride.findAll({
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
        model: Area,
        include: [{ model: Zone, include: [City] }],
        as: "PickupArea",
      },
      {
        model: Area,
        include: [{ model: Zone, include: [City] }],
        as: "DropoffArea",
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
    ],
    order: [["updatedAt", "DESC"]],
  });

  worksheet.columns = getColumnsConfig([
    "RIDE ID",
    "STATUS",
    "COMPANY",
    "DRIVER",
    // "DRIVER PHONE",
    "VEHICLE",
    "PRICE",
    "COST",
    "CUSTOMER DISCOUNT",
    "DRIVER INCENTIVE",
    "PICKUP CITY",
    "PICKUP ZONE",
    "PICKUP AREA",
    "PICKUP ADDRESS",
    "PICKUP DATE",
    "DROPOFF CITY",
    "DROPOFF ZONE",
    "DROPOFF AREA",
    "DROPOFF ADDRESS",
    "DROPOFF DATE",
    // "CATEGORY",
    // "PRODUCTS",
    // "QUANTITIES"
  ]);

  worksheet.addRows(
    response.map((row) => [
      row.id,
      row.status,
      row.Customer.name,
      row.Driver.name,
      // row.Driver.phone,
      row.Vehicle.registrationNumber,
      row.price,
      row.cost,
      row.customerDiscount,
      row.driverIncentive,
      row.PickupArea.Zone.City.name,
      row.PickupArea.Zone.name,
      row.PickupArea.name,
      row.pickupAddress,
      moment(row.pickupDate).tz("Asia/Karachi").format("DD/MM/yy h:mm A"),
      row.DropoffArea.Zone.City.name,
      row.DropoffArea.Zone.name,
      row.DropoffArea.name,
      row.dropoffAddress,
      moment(row.dropoffDate).tz("Asia/Karachi").format("DD/MM/yy h:mm A"),
      // row.RideProducts.map((product) => `Name = ${product.name}, Qty = ${product.quantity}`),
      // row.RideProducts.map((product, idx) => `Name${idx + 1} = ${product.name}`),
      // row.RideProducts.map((product, idx) => `Qty${idx + 1} = ${product.quantity}`),
      // row.RideProducts.map((product, idx) => `${idx + 1}: ${product.Category.name}`),
      // row.RideProducts.map((product, idx) => `${idx + 1}: ${product.name}`),
      // row.RideProducts.map((product, idx) => `${idx + 1}: ${product.quantity}`)
    ])
  );

  // separate sheet for product details
  worksheet = workbook.addWorksheet("Product Details");

  worksheet.columns = getColumnsConfig([
    "RIDE ID",
    "CATEGORY",
    "PRODUCT NAME",
    "QUANTITY",
  ])

  response.map((row) => {
    worksheet.addRows(
      row.RideProducts.map((product) => [
        row.id,
        product.Category.name,
        product.name,
        product.quantity
      ])
    )
  })


  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});

module.exports = router;
