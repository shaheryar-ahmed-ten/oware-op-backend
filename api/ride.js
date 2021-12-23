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
  RideDropoff,
  DropoffProduct,
  sequelize,
} = require("../models");
const models = require("../models/index");
const config = require("../config");
const { Op } = require("sequelize");
const RIDE_STATUS = require("../enums/rideStatus");
const DROPOFF_STATUS = require("../enums/dropoffStatus.js");
const { RELATION_TYPES, RIDE_WHATSAPP_ALERT } = require("../enums");
const { digitize, addActivityLog, isValidDate, convertToUTC } = require("../services/common.services");
const ExcelJS = require("exceljs");
const authService = require("../services/auth.service");
const moment = require("moment-timezone");
const { previewFile } = require("../services/s3.service");
const activityLog = require("../middlewares/activityLog");
const Dao = require("../dao");
const { sendWhatsappAlert, sendSMS } = require("../services/common.services");
const httpStatus = require("http-status");
const Joi = require("joi");
const { number } = require("joi");
const Api = require("twilio/lib/rest/Api");

const AddValidation = Joi.object({
  status: Joi.string().required(),
  vehicleId: Joi.number().integer().optional().allow(null),
  driverId: Joi.number().integer().optional().allow(null),
  pickupAddress: Joi.string().optional(),
  pickupLocation: Joi.optional().allow(null),
  customerId: Joi.number().integer().required(),
  cancellationReason: Joi.string().optional().allow(null, ""),
  cancellationComment: Joi.string().optional().allow(null, ""),
  price: Joi.optional().allow(null, ""),
  cost: Joi.optional().allow(null, ""),
  customerDiscount: Joi.optional().allow(null, ""),
  driverIncentive: Joi.optional().allow(null, ""),
  pickupDate: Joi.date().optional().allow(null),
  pickupCityId: Joi.number().integer().optional().allow(null),
  isActive: Joi.optional().allow(null),
  weightCargo: Joi.optional().allow(null),
  eta: Joi.optional().allow(null),
  completionTime: Joi.optional().allow(null),
  eirId: Joi.optional().allow(null),
  builtyId: Joi.optional().allow(null),
  dropoffs: Joi.array().items(
    Joi.object({
      sequenceNumber: Joi.optional().allow(null, ""),
      outwardId: Joi.number().integer().optional().allow(null),
      dropoffCityId: Joi.number().integer().optional().allow(null),
      dropoffAddress: Joi.string().optional().allow(null, ""),
      dropoffLocation: Joi.optional().allow(null),
      dropoffDate: Joi.date().optional().allow(null),
      dropoffStatus: Joi.string().optional().allow(null),
      pocName: Joi.string().optional().allow(null, ""),
      pocNumber: Joi.optional().allow(null, ""),
      currentLocation: Joi.string().optional(),
      memo: Joi.string().optional().allow(null, ""),
      manifestId: Joi.number().integer().optional().allow(null, ""),
      products: Joi.array().optional().allow(null),
    })
  ),
});

const changeValidation = Joi.object({
  dropoffs: Joi.array().items(
    Joi.object({
      rideId: Joi.number().integer().optional(),
      outwardId: Joi.number().integer().optional().allow(null),
      dropoffCityId: Joi.number().integer().optional(),
      dropoffAddress: Joi.string().optional(),
      dropoffLocation: Joi.optional(),
      dropoffDateTime: Joi.date().optional(),
      status: Joi.string().optional(),
      pocName: Joi.string().optional(),
      pocNumber: Joi.number().integer().optional(),
      currentLocation: Joi.string().optional(),
      memo: Joi.string().optional(),
      manifestId: Joi.number().integer().optional(),
      products: Joi.array().optional(),
    })
  ),
});

const filterDataForSMS = async (id, status, vehicleId, customerId, internalIdForBusiness) => {
  // console.log(id,status,vehicleId,customerId,internalIdForBusiness)
  let where = { id: customerId };
  const companyResponse = await Company.findOne({
    include: [{ model: User }, { model: Vehicle, as: "Vehicles" }],
    where: { ...where, relationType: RELATION_TYPES.CUSTOMER },
  });
  const vehicleResponse = await Vehicle.findOne({ where: { id: vehicleId } });
  const carResponse = await Car.findOne({
    where: { id: vehicleResponse.carId },
    include: [{ model: CarMake }, { model: CarModel }],
  });
  // console.log("companyRespo",companyResponse);
  // console.log("companyResponseveicle",vehicleResponse,vehicleResponse.registrationNumber)
  // console.log("carResponse",carResponse)
  // console.log("carMake Name",carResponse.CarMake.name);

  var customerPhone = companyResponse.phone.toString();
  var customerPhone = customerPhone.replace(/0\d+/, function (t) {
    return t.substring(1);
  });
  const formattedNumberPhone = "92" + customerPhone;
  // console.log("formatted Number", formattedNumberPhone);
  const vehicleRegistrationNumber = vehicleResponse.registrationNumber ? vehicleResponse.registrationNumber : "";
  const carName =
    carResponse.CarMake && carResponse.CarModel ? `${carResponse.CarMake.name}${carResponse.CarModel.name}` : "-";

  // const destinationNumber = "923029199786"
  // Testing status
  // const notificationMessageNotAssigned =  `Dear Oware customer,  your ride #${internalIdForBusiness} using ${carName} having vehicle registration # ${vehicleRegistrationNumber} has been not assigned successfully. Thank you for using Oware, your trusted fulfilment partner.`;
  // Real statuses
  const notificationMessageOnWay = `Dear Oware customer,  your ride #${internalIdForBusiness} is now on the way for loading on a ${carName} having vehicle registration # ${vehicleRegistrationNumber}.`;
  const notificationMessageJourneyInProgress = `Dear Oware customer, your Ride ID# ${internalIdForBusiness} is now on the way for delivery on a ${carName} having vehicle registration # ${vehicleRegistrationNumber}.`;
  const notificationMessageRideCompleted = `Dear Oware customer,  your ride #${internalIdForBusiness} using ${carName} having vehicle registration # ${vehicleRegistrationNumber} has been completed successfully. Thank you for using Oware, your trusted fulfilment partner.`;
  const notificationMessageRideCancelled = `Dear Oware customer,  your Ride ID# ${internalIdForBusiness} has been cancelled.`;

  // if(status === "Not Assigned"){
  //   // console.log("not assigned if")
  //   sendSMS(formattedNumberPhone,notificationMessageNotAssigned)
  // }
  // else
  if (status === "On the way") {
    // console.log("On the way if")
    sendSMS(formattedNumberPhone, notificationMessageOnWay);
  } else if (status === "Journey in-progress") {
    sendSMS(formattedNumberPhone, notificationMessageJourneyInProgress);
  } else if (status === "Completed") {
    sendSMS(formattedNumberPhone, notificationMessageRideCompleted);
  } else if (status === "Cancelled") {
    sendSMS(formattedNumberPhone, notificationMessageRideCancelled);
  }
};

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
      // "$Vehicle.registrationNumber$",
      "id",
      "$Customer.name$",
      // "$Driver.Vendor.name$",
      // "$Driver.name$",
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

  if (req.query.status) where["status"] = RIDE_STATUS[req.query.status];
  const response = await Ride.findAndCountAll({
    distinct: true,
    include: [
      {
        model: Company,
        as: "Customer",
        required: true,
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
            include: [{ model: CarModel }, CarMake, VehicleType],
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
        model: RideDropoff,
        as: "RideDropoff",
        include: ["DropoffCity", "ProductOutward"],
      },
    ],
    order: [["updatedAt", "DESC"]],
    where,
    limit,
    offset,
    // logging: true,
  });

  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
    count: response.count,
  });
});

// test api for sms
router.post("/testsms", async (req, res, next) => {
  const destinationNumber = "923029199786";
  const notificationMessage = `Your Ride ${destinationNumber} is ON the Way`;
  // const response =
  sendSMS(destinationNumber, notificationMessage);
  // console.log(response)

  if (res.statusCode == 200) {
    res.json({
      success: true,
    });
  }
});

router.get("/all", async (req, res, next) => {
  const response = await Ride.findAll({
    attributes: ["id", "internalIdForBusiness"],
    order: [["updatedAt", "DESC"]],
  });

  res.json({
    success: true,
    message: "respond with a resource",
    data: response,
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

  res.json({
    success: true,
    message: "respond with a resource",
    data: response,
  });
});

router.get("/filtered-outwards", async (req, res, next) => {
  try {
    const outwards = await Dao.ProductOutward.findAll({
      include: [{ model: RideDropoff, required: false }],
      where: { "$RideDropoff.outwardId$": null, externalVehicle: null },
    });

    if (outwards) {
      res.sendJson(outwards, "successfully get outwards", httpStatus.OK);
    } else {
      res.sendJson(outwards, "successfully get outwards", httpStatus.NOT_FOUND);
    }
  } catch (err) {
    console.log("err", err);
    res.sendError(httpStatus.CONFLICT, "Failed to get Outwards", err.message);
  }
});

router.get("/outward", async (req, res, next) => {
  try {
    const outwards = await Dao.ProductOutward.findAll({
      where: { externalVehicle: null },
    });

    if (outwards) {
      res.sendJson(outwards, "successfully get outwards", httpStatus.OK);
    } else {
      res.sendJson(outwards, "successfully get outwards", httpStatus.NOT_FOUND);
    }
  } catch (err) {
    console.log("err", err);
    res.sendError(httpStatus.CONFLICT, "Failed to get Outwards", err.message);
  }
});

router.get("/relations", async (req, res, next) => {
  try {
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

    const cancellationReasons = (
      await Dao.RideCancellationReason.findAll({
        where: {},
        attributes: ["cancellationReason"],
      })
    ).map((reason) => reason.cancellationReason);

    const statuses = RIDE_STATUS;
    const dropoffStatuses = DROPOFF_STATUS;
    res.json({
      success: true,
      message: "respond with a resource",
      vehicles,
      drivers,
      statuses,
      dropoffStatuses,
      cities,
      companies,
      vendors,
      cars,
      productCategories,
      cancellationReasons,
    });
  } catch (err) {
    console.log("err", err);
    return res.sendError(httpStatus.CONFLICT, "Cannot create Ride", err);
  }
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
      value: await Ride.aggregate("id", "count", { where: { status: RIDE_STATUS[status] } }),
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

  let worksheet = workbook.addWorksheet("Loads");

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

  if (req.query.status) where["status"] = RIDE_STATUS[req.query.status];

  const response = await Ride.findAndCountAll({
    distinct: true,
    include: [
      {
        model: Company,
        as: "Customer",
        required: true,
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
            include: [{ model: CarModel }, CarMake, VehicleType],
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
        model: RideDropoff,
        as: "RideDropoff",
        include: ["DropoffCity", "ProductOutward"],
      },
    ],
    order: [["updatedAt", "DESC"]],
    where,
  });

  worksheet.columns = getColumnsConfig([
    "LOAD ID",
    "STATUS",
    "CANCELLATION REASON",
    "CANCELLATION COMMENT",
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
    // "DROPOFF CITY",
    // "DROPOFF ADDRESS",
    // "DROPOFF DATE",
    "CREATED DATE",
    "UPDATED DATE",
    // "POC NAME",
    // "POC NUMBER",
    "ETA(MINUTES)",
    "TRIP COMPLETION TIME(MINUTES)",
    // "CURRENT LOCATION",
    "WEIGHT OF CARGO(KG)",
    // "MEMO",
  ]);

  worksheet.addRows(
    response.rows.map((row) => [
      row.id,
      row.status ? row.status : " ",
      row.cancellationReason ? row.cancellationReason : " ",
      row.cancellationComment ? row.cancellationComment : " ",
      row.Customer && row.Customer.name ? row.Customer.name : " ",
      row.Driver ? row.Driver.Vendor.name : "",
      row.Vehicle ? row.Vehicle.Car.CarMake.name + " " + row.Vehicle.Car.CarModel.name : " ",
      row.Driver ? row.Driver.name : row.Driver,
      row.Vehicle ? row.Vehicle.registrationNumber : " ",
      row.price ? row.price : " ",
      row.cost ? row.cost : " ",
      row.customerDiscount ? row.customerDiscount : " ",
      row.driverIncentive ? row.driverIncentive : " ",
      row.pickupCity ? row.pickupCity.name : " ",
      row.pickupAddress ? row.pickupAddress : " ",
      isValidDate(row.pickupDate) ? moment(row.pickupDate).tz(req.query.client_Tz).format("DD/MM/yy h:mm A") : " ",
      // row.dropoffCity ? row.dropoffCity.name : " ",
      // row.dropoffAddress ? row.dropoffAddress : " ",
      // isValidDate(row.dropoffDate) ? moment(row.dropoffDate).tz(req.query.client_Tz).format("DD/MM/yy h:mm A") : " ",
      // moment(row.dropoffDate).tz(req.query.client_Tz).format("DD/MM/yy h:mm A"),
      isValidDate(row.createdAt) ? moment(row.createdAt).tz(req.query.client_Tz).format("DD/MM/yy h:mm A") : " ",
      // moment(row.createdAt).tz(req.query.client_Tz).format("DD/MM/yy h:mm A"),
      isValidDate(row.updatedAt) ? moment(row.updatedAt).tz(req.query.client_Tz).format("DD/MM/yy h:mm A") : " ",
      // moment(row.updatedAt).tz(req.query.client_Tz).format("DD/MM/yy h:mm A"),
      // row.pocName ? row.pocName : " ",
      // row.pocNumber ? row.pocNumber : " ",
      row.eta !== null && row.eta !== 0 ? row.eta / 60 : 0,
      row.completionTime !== null && row.completionTime !== 0 ? row.completionTime / 60 : 0,
      // row.currentLocation ? row.currentLocation : " ",
      row.weightCargo ? row.weightCargo : " ",
      // row.memo ? row.memo : " ",
    ])
  );

  // separate sheet for dropoff details
  worksheet = workbook.addWorksheet("Dropoff Details");

  worksheet.columns = getColumnsConfig([
    "LOAD ID",
    "OUTWARD ID",
    "DROPOFF CITY",
    "DROPOFF ADDRESS",
    "DROPOFF DATE",
    "POC NAME",
    "POC NUMBER",
    "CURRENT LOCATION",
    "MEMO",
  ]);

  response.rows.map((row) => {
    worksheet.addRows(
      row.RideDropoff.map((dropoff) => [
        row.id,
        dropoff.ProductOutward ? dropoff.ProductOutward.internalIdForBusiness : " ",
        dropoff.DropoffCity ? dropoff.DropoffCity.name : " ",
        dropoff.address ? dropoff.address : " ",
        isValidDate(dropoff.dateTime)
          ? moment(dropoff.dateTime).tz(req.query.client_Tz).format("DD/MM/yy h:mm A")
          : " ",
        dropoff.pocName ? dropoff.pocName : " ",
        dropoff.pocNumber ? dropoff.pocNumber : " ",
        dropoff.currentLocation ? dropoff.currentLocation : " ",
        dropoff.memo ? dropoff.memo : " ",
      ])
    );
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=" + "Inventory.xlsx");

  await workbook.xlsx.write(res).then(() => res.end());
});

// get ride product manifest
router.get("/preview/:id", async (req, res, next) => {
  const id = req.params.id;
  let file = await File.findOne({ where: { id } });
  let preview = await previewFile(file.bucket, file.key);
  res.json({ preview });
});

// Get single ride
router.get("/:id", async (req, res, next) => {
  let ride = await Ride.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: Company,
        as: "Customer",
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
      { model: RideDropoff, as: "RideDropoff", include: [{ model: City, as: "DropoffCity" },{ model: models.ProductOutward, as: "ProductOutward" }] },
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

/* POST create new ride. */
router.post("/", activityLog, async (req, res, next) => {
  let message = "New ride registered";
  let ride;
  try {
    const isValid = await AddValidation.validateAsync(req.body);

    if (isValid) {
      console.log("req.body", req.body);
      let products = req.body.products;
      delete req.body.products;
      await sequelize.transaction(async (transaction) => {
        req.body["pickupDate"] = isValidDate(req.body["pickupDate"]) ? convertToUTC(req.body["pickupDate"]) : null;
        req.body["dropoffDate"] = isValidDate(req.body["dropoffDate"]) ? convertToUTC(req.body["dropoffDate"]) : null;
        ride = await Ride.create(
          {
            userId: req.userId,
            ...req.body,
          },
          { transaction }
        );
        ride.internalIdForBusiness = digitize(ride.id, 6);
        // filterDataForSMS(ride.id,ride.status,ride.vehicleId,ride.customerId);
        ride.save({ transaction });

        let sequenceNumber = 1;
        await RideDropoff.bulkCreate(
          req.body.dropoffs.map((dropoff) => ({
            sequenceNumber: sequenceNumber++,
            rideId: ride.id,
            outwardId: dropoff.outwardId,
            cityId: dropoff.dropoffCityId,
            address: dropoff.dropoffAddress,
            location: dropoff.dropoffLocation,
            dateTime: dropoff.dropoffDate,
            status: dropoff.dropoffStatus,
            pocName: dropoff.pocName,
            pocNumber: dropoff.pocNumber,
            currentLocation: dropoff.currentLocation,
            memo: dropoff.memo,
            manifestId: dropoff.manifestId,
          })),
          { transaction }
        );
        filterDataForSMS(ride.id, ride.status, ride.vehicleId, ride.customerId, ride.internalIdForBusiness);
      });
    } else {
      return res.sendError(httpStatus.UNPROCESSABLE_ENTITY, isValid, "Unable to add ride");
    }
  } catch (err) {
    console.log("err", err);
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
  try {
    const isValid = await AddValidation.validateAsync(req.body);

    if (isValid) {
      console.log("req.body", req.body);

      let ride = await Ride.findOne({
        where: { id: req.params.id },
      });
      const initialRideStatus = ride.status;
      if (!ride)
        return res.status(400).json({
          success: false,
          message: "No ride found!",
        });

      await sequelize.transaction(async (transaction) => {
        await Ride.update(req.body, { where: { id: req.params.id } }, { transaction });

        let sequenceNumber = 1;
        if (req.body.hasOwnProperty("dropoffs")) {
          await RideDropoff.destroy({ where: { rideId: req.params.id } });
          await RideDropoff.bulkCreate(
            req.body.dropoffs.map((dropoff) => ({
              sequenceNumber: sequenceNumber++,
              rideId: ride.id,
              outwardId: dropoff.outwardId,
              cityId: dropoff.dropoffCityId,
              address: dropoff.dropoffAddress,
              location: dropoff.dropoffLocation,
              dateTime: dropoff.dropoffDate,
              status: dropoff.dropoffStatus,
              pocName: dropoff.pocName,
              pocNumber: dropoff.pocNumber,
              currentLocation: dropoff.currentLocation,
              memo: dropoff.memo,
              manifestId: dropoff.manifestId,
            })),
            { transaction }
          );
        }

        let response = await Ride.findOne({
          where: { id: req.params.id },
          attributes: ["id"],
          include: ["RideDropoff"],
        });
        // sms Api
        filterDataForSMS(ride.id, ride.status, ride.vehicleId, ride.customerId, ride.internalIdForBusiness);

        await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
        return res.json({
          success: true,
          message: "Ride updated",
          data: response,
        });
      });
    } else {
      return res.sendError(httpStatus.UNPROCESSABLE_ENTITY, isValid, "Unable to update ride");
    }
  } catch (err) {
    console.log("err", err);
    return res.json({
      success: false,
      message: err.message,
    });
  }
});

router.put("/changeRide/:id", activityLog, async (req, res, next) => {
  try {
    const isValid = await changeValidation.validateAsync(req.body);

    if (isValid) {
      let ride = await Ride.findOne({
        where: { id: req.params.id },
      });
      const initialRideStatus = ride.status;
      if (!ride)
        return res.status(400).json({
          success: false,
          message: "No ride found!",
        });

      await sequelize.transaction(async (transaction) => {
        // await Ride.update(req.body, { where: { id: req.params.id } }, { transaction });

        if (req.body.hasOwnProperty("dropoffs")) {
          const anotherRide = [];
          const sameRide = [];
          for (const dropoff of req.body.dropoffs) {
            if (dropoff.rideId && dropoff.rideId !== ride.id) {
              anotherRide.push(dropoff);
            } else {
              sameRide.push(dropoff);
            }
          }

          let sequenceNumber = 0;
          await RideDropoff.destroy({ where: { rideId: req.params.id } });
          await RideDropoff.bulkCreate(
            sameRide.map((dropoff) => ({
              sequenceNumber: sequenceNumber++,
              rideId: ride.id,
              outwardId: dropoff.outwardId,
              dropoffCityId: dropoff.dropoffCityId,
              dropoffAddress: dropoff.dropoffAddress,
              dropoffLocation: dropoff.dropoffLocation,
              dropoffDateTime: dropoff.dropoffDateTime,
              status: dropoff.status,
              pocName: dropoff.pocName,
              pocNumber: dropoff.pocNumber,
              currentLocation: dropoff.currentLocation,
              memo: dropoff.memo,
              manifestId: dropoff.manifestId,
            })),
            { transaction }
          );

          let seq = (
            await RideDropoff.findAll({
              where: {
                rideId: anotherRide[0].rideId,
              },
              limit: 1,
              order: [["sequenceNumber", "DESC"]],
            })
          )[0].sequenceNumber;

          console.log("seq", seq);

          await RideDropoff.bulkCreate(
            anotherRide.map((dropoff) => ({
              rideId: dropoff.rideId,
              sequenceNumber: ++seq,
              outwardId: dropoff.outwardId,
              dropoffCityId: dropoff.dropoffCityId,
              dropoffAddress: dropoff.dropoffAddress,
              dropoffLocation: dropoff.dropoffLocation,
              dropoffDateTime: dropoff.dropoffDateTime,
              status: dropoff.status,
              pocName: dropoff.pocName,
              pocNumber: dropoff.pocNumber,
              currentLocation: dropoff.currentLocation,
              memo: dropoff.memo,
              manifestId: dropoff.manifestId,
            })),
            { transaction }
          );
        }

        let response = await Ride.findOne({
          where: { id: req.params.id },
          attributes: ["id"],
          include: ["RideDropoff"],
        });

        // Sms Api
        // filterDataForSMS(req.body.id,req.body.status,req.body.vehicleId,req.body.customerId);

        await addActivityLog(req["activityLogId"], response, Dao.ActivityLog);
        return res.json({
          success: true,
          message: "Ride updated",
          data: response,
        });
      });
      // filterDataForSMS(req.body.id,req.body.status,req.body.vehicleId,req.body.customerId);
    } else {
      return res.sendError(httpStatus.UNPROCESSABLE_ENTITY, isValid, "Unable to update ride");
    }
  } catch (err) {
    console.log("err", err);
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

module.exports = router;
