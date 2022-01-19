const express = require("express");
const router = express.Router();
const {
  Inventory,
  InventoryDetail,
  ProductInward,
  InwardGroup,
  User,
  Company,
  Warehouse,
  Product,
  UOM,
  sequelize,
  InwardGroupBatch,
} = require("../models");
const { BULK_PRODUCT_LIMIT, SPECIAL_CHARACTERS } = require("../enums");
const config = require("../config");
const { Op } = require("sequelize");
const authService = require("../services/auth.service");
const {
  digitize,
  checkForMatchInArray,
} = require("../services/common.services");
const { RELATION_TYPES } = require("../enums");
const activityLog = require("../middlewares/activityLog");
const ExcelJS = require("exceljs");
const moment = require("moment-timezone");
const httpStatus = require("http-status");

const Joi = require("joi");
const inventory = require("../models/inventory");

const AddValidation = Joi.object({
  customerId: Joi.number().integer().required(),
  quantity: Joi.number().integer().required(),
  warehouseId: Joi.number().integer().required(),
  referenceId: Joi.string().optional().allow(null),
  vehicleType: Joi.string().optional().allow(null),
  vehicleName: Joi.string().optional().allow(null),
  vehicleNumber: Joi.string().optional().allow(null),
  driverName: Joi.string().optional().allow(null),
  memo: Joi.string().optional().allow(null),
  productId: Joi.optional().allow(null),
  products: Joi.array().items(
    Joi.object({
      product: {
        id: Joi.number().integer().required(),
        userId: Joi.number().integer().required(),
        name: Joi.string().optional().allow(null),
        description: Joi.string().optional().allow(null),
        dimensionsCBM: Joi.number().required(),
        weight: Joi.optional(),
        categoryId: Joi.number().integer().required(),
        brandId: Joi.number().integer().required(),
        uomId: Joi.number().integer().required(),
        isActive: Joi.boolean().required(),
        batchEnabled: Joi.boolean().required(),
        createdAt: Joi.date().required(),
        updatedAt: Joi.date().required(),
        deletedAt: Joi.date().optional().allow(null),
        UOM: {
          id: Joi.number().integer().required(),
          userId: Joi.number().integer().required(),
          name: Joi.string().required(),
          isActive: Joi.boolean().required(),
          createdAt: Joi.date().required(),
          updatedAt: Joi.date().required(),
          deletedAt: Joi.date().optional().allow(null),
        },
      },
      id: Joi.number().integer().required(),
      quantity: Joi.number().integer().required(),
      batchNumber: Joi.string().optional().allow("").allow(null),
      manufacturingDate: Joi.date().optional().allow(null),
      expiryDate: Joi.date().optional().allow(null),
      batchName: Joi.required().allow("").allow(null),
    })
  ),
  internalIdForBusiness: Joi.string().optional().allow(null),
});

/* GET productInwards listing. */
router.get("/", async (req, res, next) => {
  const limit = req.query.rowsPerPage || config.rowsPerPage;
  const offset = (req.query.page - 1 || 0) * limit;
  let where = {
    // userId: req.userId
  };
  if (req.query.search)
    where[Op.or] = [
      "internalIdForBusiness",
      "$Company.name$",
      "$Warehouse.name$",
    ].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where.createdAt = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.startingDate && req.query.endingDate) {
    const startDate = moment(req.query.startingDate).utcOffset("+05:00").set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const endDate = moment(req.query.endingDate).utcOffset("+05:00").set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 1000,
    });
    where.createdAt = { [Op.between]: [startDate, endDate] };
  }

  const response = await ProductInward.findAndCountAll({
    distinct: true,
    include: [
      // {
      //   model: Product,
      //   as: "Product",
      //   include: [{ model: UOM }],
      // },
      // {
      //   model: Product,
      //   as: "Products",
      //   include: [
      //     { model: UOM },
      //   ],
      // },
      User,
      {
        model: Company,
        as: "Company",
        required: true,
      },
      {
        model: Warehouse,
        as: "Warehouse",
        required: true,
      },
      // { model: InwardGroup, as: "InwardGroup", include: ["InventoryDetail"] },
    ],
    order: [["updatedAt", "DESC"]],
    where,
    limit,
    offset,
  });

  // for (const inward of response.rows) {
  //   for (const product of inward.Products) {
  //     const detail = await InventoryDetail.findAll({
  //       include: [
  //         {
  //           model: InwardGroup,
  //           as: "InwardGroup",
  //           through: InwardGroupBatch,
  //         },
  //       ],
  //       where: { "$InwardGroup.id$": { [Op.eq]: product.InwardGroup.id } },
  //       logging: true,
  //     });
  //     product.InwardGroup.dataValues.InventoryDetail = detail;
  //   }
  // }
  res.json({
    success: true,
    message: "respond with a resource",
    data: response.rows,
    pages: Math.ceil(response.count / limit),
  });
});

router.get("/export", async (req, res, next) => {
  let where = {};
  if (!authService.isSuperAdmin(req)) where["$Company.contactId$"] = req.userId;

  let workbook = new ExcelJS.Workbook();

  let worksheet = workbook.addWorksheet("Product Inwards");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({
      header: column,
      width: Math.ceil(column.length * 1.5),
      outlineLevel: 1,
    }));

  worksheet.columns = getColumnsConfig([
    "INWARD ID",
    "CUSTOMER",
    "PRODUCT",
    "WAREHOUSE",
    "UOM",
    "INWARD QUANTITY",
    "VEHICLE TYPE",
    "VEHICLE NAME",
    "VEHICLE NUMBER",
    "DRIVER NAME",
    "MEMO",
    "REFERENCE ID",
    "CREATOR",
    "INWARD DATE",
    // "BATCH ENABLED",
    "BATCH QUANTITY",
    "BATCH NUMBER",
    "MANUFACTURING DATE",
    "EXPIRY DATE",
  ]);

  if (req.query.search)
    where[Op.or] = [
      "internalIdForBusiness",
      "$Company.name$",
      "$Warehouse.name$",
    ].map((key) => ({
      [key]: { [Op.like]: "%" + req.query.search + "%" },
    }));

  if (req.query.days) {
    const currentDate = moment();
    const previousDate = moment().subtract(req.query.days, "days");
    where.createdAt = { [Op.between]: [previousDate, currentDate] };
  } else if (req.query.startingDate && req.query.endingDate) {
    const startDate = moment(req.query.startingDate).utcOffset("+05:00").set({
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    });
    const endDate = moment(req.query.endingDate).utcOffset("+05:00").set({
      hour: 23,
      minute: 59,
      second: 59,
      millisecond: 1000,
    });
    where.createdAt = { [Op.between]: [startDate, endDate] };
  }

  response = await ProductInward.findAll({
    include: [
      { model: User },
      { model: Product, as: "Products", include: [{ model: UOM }] },
      { model: Company },
      { model: Warehouse },
      { model: InwardGroup, as: "InwardGroup", include: ["InventoryDetail"] }
    ],
    order: [["updatedAt", "DESC"]],
    where,
    limit: 50
  });

  const inwardArray = [];
  for (const inward of response) {
    for (const Product of inward.Products) {
      if (Product.batchEnabled) {
        var invGroup = inward.InwardGroup.find((invGroup) => invGroup.id == Product.InwardGroup.id)
        for (const invDetail of invGroup.InventoryDetail) {
          inwardArray.push([
            inward.internalIdForBusiness || "",
            inward.Company.name,
            Product.name,
            inward.Warehouse.name,
            Product.UOM.name,
            Product.InwardGroup.quantity,
            inward.vehicleType || "",
            inward.vehicleName || "",
            inward.vehicleNumber || "",
            inward.driverName || "",
            inward.memo || "",
            inward.referenceId || "",
            `${inward.User.firstName || ""} ${inward.User.lastName || ""}`,
            moment(inward.createdAt)
              .tz(req.query.client_Tz)
              .format("DD/MM/yy HH:mm"),
            invDetail.InwardGroupBatch ? invDetail.InwardGroupBatch.quantity : "",
            invDetail.batchNumber || "",
            invDetail.manufacturingDate ?
              moment(invDetail.manufacturingDate)
                .tz(req.query.client_Tz)
                .format("DD/MM/yy")
              :
              ""
            ,
            invDetail.expiryDate ?
              moment(invDetail.expiryDate)
                .tz(req.query.client_Tz)
                .format("DD/MM/yy")
              :
              ""
          ]);
        }
      }
      else {
        inwardArray.push([
          inward.internalIdForBusiness || "",
          inward.Company.name,
          Product.name,
          inward.Warehouse.name,
          Product.UOM.name,
          Product.InwardGroup.quantity,
          inward.vehicleType || "",
          inward.vehicleName || "",
          inward.vehicleNumber || "",
          inward.driverName || "",
          inward.memo || "",
          inward.referenceId || "",
          `${inward.User.firstName || ""} ${inward.User.lastName || ""}`,
          moment(inward.createdAt)
            .tz(req.query.client_Tz)
            .format("DD/MM/yy HH:mm"),
          "",
          "",
          "",
          ""
        ]);
      }
    }
  }

  worksheet.addRows(inwardArray);

  // worksheet = workbook.addWorksheet("Batch Details");

  // worksheet.columns = getColumnsConfig([
  //   "INWARD ID",
  //   "PRODUCT NAME",
  //   "QUANTITY",
  //   "BATCH NUMBER",
  //   "MANUFACTURING DATE",
  //   "EXPIRY DATE",
  // ]);

  // var invDetailArr = []
  // for (const inward of response) {
  //   for (const Product of inward.Products) {
  //     if (Product.batchEnabled) {
  //       var invGroup = inward.InwardGroup.find((invGroup) => invGroup.id == Product.InwardGroup.id)
  //       for (const invDetail of invGroup.InventoryDetail) {
  //         invDetailArr.push([
  //           inward.internalIdForBusiness || "",
  //           Product.name || "",
  //           invDetail.InwardGroupBatch ? invDetail.InwardGroupBatch.quantity : "",
  //           invDetail.batchNumber || "",
  //           invDetail.manufacturingDate ?
  //             moment(invDetail.manufacturingDate)
  //               .tz(req.query.client_Tz)
  //               .format("DD/MM/yy")
  //             :
  //             ""
  //           ,
  //           invDetail.expiryDate ?
  //             moment(invDetail.expiryDate)
  //               .tz(req.query.client_Tz)
  //               .format("DD/MM/yy")
  //             :
  //             ""
  //         ])
  //       }
  //     }

  //   }
  // }

  // worksheet.addRows(invDetailArr);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + "Inventory.xlsx"
  );

  await workbook.xlsx.write(res).then(() => res.end());
});

router.get("/max-batch-id", async (req, res, next) => {
  try {
    const max = await InventoryDetail.findOne({
      order: [["id", "DESC"]],
      limit: 1,
      attributes: ["id"],
      paranoid: false,
    });

    let inventory;
    inventory = await Inventory.findOne({
      order: [["id", "DESC"]],
      limit: 1,
      attributes: ["id"],
      paranoid: false,
    });

    if (max.id) {
      id = max.id + 1;
    } else {
      id = 1;
    }

    if (inventory.id) {
      inventoryId = inventory.id + 1;
    } else {
      inventoryId = 1;
    }

    res.sendJson({ id, inventoryId }, "max inventory Batch id", httpStatus.OK);
  } catch (err) {
    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

router.get("/existingBatches", async (req, res, next) => {
  const { batchNumber, expiryDate, customerId, productId, warehouseId } =
    req.query;
  const expiryWithoutTz = expiryDate ? expiryDate.split("T")[0] : null;
  try {
    let batches = null;

    if (!batchNumber && !expiryDate) {
      batches = await InventoryDetail.findAll({
        include: [{ model: Inventory, as: "Inventory", attributes: [] }],
        where: {
          [Op.and]: [
            {
              "$Inventory.customerId$": { [Op.eq]: customerId },
            },
            {
              "$Inventory.productId$": { [Op.eq]: productId },
            },
            {
              "$Inventory.warehouseId$": { [Op.eq]: warehouseId },
            },
          ],
        },
      });
    } else if (
      !expiryDate &&
      batchNumber &&
      customerId &&
      warehouseId &&
      productId
    ) {
      batches = await InventoryDetail.findAll({
        include: [{ model: Inventory, as: "Inventory", attributes: [] }],
        where: {
          [Op.and]: [
            { batchNumber: { [Op.eq]: batchNumber } },
            {
              "$Inventory.customerId$": { [Op.eq]: customerId },
            },
            {
              "$Inventory.productId$": { [Op.eq]: productId },
            },
            {
              "$Inventory.warehouseId$": { [Op.eq]: warehouseId },
            },
          ],
        },
      });
    } else if (!batchNumber && expiryDate) {
      batches = await InventoryDetail.findAll({
        include: [{ model: Inventory, as: "Inventory", attributes: [] }],
        where: {
          [Op.and]: [
            {
              expiryDate: { [Op.eq]: new Date(expiryWithoutTz) },
            },
            {
              "$Inventory.customerId$": { [Op.eq]: customerId },
            },
            {
              "$Inventory.productId$": { [Op.eq]: productId },
            },
            {
              "$Inventory.warehouseId$": { [Op.eq]: warehouseId },
            },
          ],
        },
      });
    } else if (batchNumber && expiryDate) {
      batches = await InventoryDetail.findAll({
        include: [{ model: Inventory, as: "Inventory", attributes: [] }],
        where: {
          [Op.and]: [
            { batchNumber: { [Op.eq]: batchNumber } },
            {
              expiryDate: { [Op.eq]: new Date(expiryWithoutTz) },
            },
            {
              "$Inventory.customerId$": { [Op.eq]: customerId },
            },
            {
              "$Inventory.productId$": { [Op.eq]: productId },
            },
            {
              "$Inventory.warehouseId$": { [Op.eq]: warehouseId },
            },
          ],
        },
      });
    }

    if (batches.length)
      res.sendJson(batches, "existing batches found", httpStatus.FOUND);
    else res.sendJson(null, "existing batches not found", httpStatus.NOT_FOUND);
  } catch (err) {
    res.sendError(httpStatus.CONFLICT, err.message);
  }
});

/* POST create new productInward. */
router.post("/", activityLog, async (req, res, next) => {
  try {
    const isValid = await AddValidation.validateAsync(req.body);
    tempArr = [];
    if (isValid) {
      let productInward;
      let message = "New productInward registered";
      // Hack for backward compatibility
      req.body.products = req.body.products || [
        { id: req.body.productId, quantity: req.body.quantity },
      ];

      // validating request payload
      const productGroups = [];
      for (const product of req.body.products) {
        if (product.product.batchEnabled) {
          if (
            product.expiryDate === null ||
            product.expiryDate === false ||
            product.batchName === null ||
            product.batchName === "" ||
            !product.batchName
          ) {
            return res.sendError(
              httpStatus.CONFLICT,
              `Expiry and batch name is mandatory when batch is enabled for product :${product.product.name}`
            );
          }
        } else {
          if (product.expiryDate || product.batchNumber)
            return res.sendError(
              httpStatus.CONFLICT,
              `Batch is not enabled for product ${product.product.name}`
            );
        }

        if (!checkForMatchInArray(productGroups, "id", product.id)) {
          productGroups.push({
            id: product.id,
            product: product.product,
            quantity: product.quantity,
            batches: [
              {
                quantity: product.quantity,
                batchNumber: product.batchNumber,
                manufacturingDate: product.manufacturingDate,
                expiryDate: product.expiryDate,
                batchName: product.batchName,
              },
            ],
          });
        } else {
          productGroups.map((prod) => {
            if (prod.id == product.id) {
              prod.quantity = prod.quantity + product.quantity;
              prod.batches.push({
                quantity: product.quantity,
                batchNumber: product.batchNumber,
                manufacturingDate: product.manufacturingDate,
                expiryDate: product.expiryDate,
                batchName: product.batchName,
              });
            }
          });
        }
      }
      req.body.products = productGroups;

      console.log("\n-------------------------------------\n");
      console.log("req.body 2", JSON.stringify(req.body));
      console.log("\n-------------------------------------\n");
      await sequelize.transaction(async (transaction) => {
        productInward = await ProductInward.create(
          {
            userId: req.userId,
            ...req.body,
          },
          { transaction }
        );
        const numberOfinternalIdForBusiness = digitize(productInward.id, 6);
        productInward.internalIdForBusiness =
          req.body.internalIdForBusiness + numberOfinternalIdForBusiness;
        await productInward.save({ transaction });

        const inwardGroups = [];
        for (const product of req.body.products) {
          const inGrp = await InwardGroup.create(
            {
              userId: req.userId,
              inwardId: productInward.id,
              productId: product.id,
              quantity: product.quantity,
            },
            { transaction }
          );
          inwardGroups.push(inGrp);
        }

        // return await Promise.all(
        //   req.body.products.map(async (product) => {
        for (const product of req.body.products) {
          let inventory = await Inventory.findOne({
            where: {
              customerId: req.body.customerId,
              warehouseId: req.body.warehouseId,
              productId: product.id,
            },
          });

          //IF inventory is not created than create inventory ELSE update existing inventory
          if (!inventory) {
            inventory = await Inventory.create(
              {
                customerId: req.body.customerId,
                warehouseId: req.body.warehouseId,
                productId: product.id,
                availableQuantity: product.quantity,
                totalInwardQuantity: product.quantity,
              },
              { transaction }
            );
          } else {
            inventory.availableQuantity += +product.quantity;
            inventory.totalInwardQuantity += +product.quantity;
            await inventory.save({ transaction });
          }

          for (const Prodbatch of product.batches) {
            if (product.product.batchEnabled === true) {
              batch = await InventoryDetail.findOne({
                where: {
                  batchName: Prodbatch.batchName,
                },
              });
              //check if the already existing batch has same batch number and expiry date
              if (
                batch &&
                batch.batchNumber &&
                batch.batchNumber !== Prodbatch.batchNumber
              ) {
                transaction.rollback();
                return res.sendError(
                  httpStatus.CONFLICT,
                  `Batch:${product.batchName} already exist with a different batch number`
                );
              }

              if (
                batch &&
                batch.expiryDate &&
                batch.expiryDate.toString().split("T")[0] !=
                new Date(Prodbatch.expiryDate).toString().split("T")[0]
              ) {
                transaction.rollback();
                return res.sendError(
                  httpStatus.CONFLICT,
                  `Batch:${product.batchName} already exist with different expiry date`
                );
              }

              if (batch && batch.batchNumber === null) {
                batch.batchNumber = Prodbatch.batchNumber;
                await batch.save({ transaction });
              }
            } else {
              batch = await InventoryDetail.findOne({
                where: {
                  batchName: {
                    [Op.like]: "%" + "default-" + inventory.id + "%",
                  },
                },
              });
            }
            //IF batch dosest exist then create new one ELSE create new one
            if (!batch) {
              batch = await InventoryDetail.create(
                {
                  InventoryId: inventory.id,
                  batchName: Prodbatch.batchName ? Prodbatch.batchName : null,
                  manufacturingDate: Prodbatch.manufacturingDate
                    ? new Date(Prodbatch.manufacturingDate)
                    : null,
                  expiryDate: Prodbatch.expiryDate
                    ? new Date(Prodbatch.expiryDate)
                    : null,
                  batchNumber: Prodbatch.batchNumber || null,
                  inwardQuantity: Prodbatch.quantity,
                  availableQuantity: Prodbatch.quantity,
                  outwardQuantity: 0,
                },
                { transaction }
              );
              if (product.product.batchEnabled === false) {
                batch.batchName = "default-" + inventory.id + "-" + batch.id;
                await batch.save({ transaction });
              }
            } else {
              //if batch exist then update already created one

              batch.inwardQuantity = batch.inwardQuantity + Prodbatch.quantity;
              batch.availableQuantity =
                batch.availableQuantity + Prodbatch.quantity;
              batch.BatchNumber = Prodbatch.BatchNumber;
              await batch.save({ transaction });
            }
            //attach batch with inward group
            const IG = inwardGroups.filter(
              (IG) =>
                IG.inwardId === productInward.id && IG.productId === product.id
            )[0];
            tempArr.push({
              inwardGroupId: IG.id,
              inventoryDetailId: batch.id,
              quantity: Prodbatch.quantity,
            });
          }
        }
      });
      for (const arr of tempArr) {
        await sequelize.query(`
          INSERT INTO InwardGroupBatches (inwardGroupId,inventoryDetailId,quantity) VALUES (${arr.inwardGroupId},${arr.inventoryDetailId},${arr.quantity});
        `);
      }
      return res.json({
        success: true,
        message,
        data: productInward,
      });
    } else {
      return res.sendError(
        httpStatus.UNPROCESSABLE_ENTITY,
        isValid,
        "Unable to add outward"
      );
    }
  } catch (err) {
    console.log("err", err);
    return res.sendError(httpStatus.CONFLICT, "Server Error", err.message);
  }
});

/* PUT update existing productInward. */
router.put("/:id", activityLog, async (req, res, next) => {
  let productInward = await ProductInward.findOne({
    where: { id: req.params.id },
  });
  if (!productInward)
    return res.status(400).json({
      success: false,
      message: "No productInward found!",
    });
  try {
    const response = await productInward.save();
    await addActivityLog(req.activityLogId, response, Dao.ActivityLog);
    return res.json({
      success: true,
      message: "Product Inward updated",
      data: response,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.errors.pop().message,
    });
  }
});

router.delete("/:id", activityLog, async (req, res, next) => {
  let response = await ProductInward.destroy({ where: { id: req.params.id } });
  if (response)
    res.json({
      success: true,
      message: "ProductInward deleted",
    });
  else
    res.status(400).json({
      success: false,
      message: "No productInward found!",
    });
});


router.get("/relations", async (req, res, next) => {
  let where = { isActive: true };

  const warehouses = await Warehouse.findAll({ where });
  const products = await Product.findAll({ where, include: [{ model: UOM }] });

  if (!authService.isSuperAdmin(req)) where.contactId = req.userId;
  const customers = await Company.findAll({
    where: {
      ...where,
      relationType: RELATION_TYPES.CUSTOMER,
    },
  });
  res.json({
    success: true,
    message: "respond with a resource",
    customers,
    warehouses,
    products,
  });
});

router.get("/:id", async (req, res, next) => {
  try {
    let productInward = await ProductInward.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Product,
          as: "Products",
          include: [{ model: UOM }],
        },
        User,
        {
          model: Company,
          as: "Company",
          required: true,
        },
        {
          model: Warehouse,
          as: "Warehouse",
          required: true,
        },
      ]
    });
    if (!productInward)
      return res.status(400).json({
        success: false,
        message: "No productInward found!",
      });

    for (const product of productInward.Products) {
      const detail = await InventoryDetail.findAll({
        include: [
          {
            model: InwardGroup,
            as: "InwardGroup",
            through: InwardGroupBatch,
          },
        ],
        where: { "$InwardGroup.id$": { [Op.eq]: product.InwardGroup.id } },
        logging: true,
      });
      product.InwardGroup.dataValues.InventoryDetail = detail;
    }

    return res.json({
      success: true,
      message: "Product Inward Found",
      data: productInward,
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err
    });
  }

})

router.post("/bulk", async (req, res, next) => {
  try {
    let productInwards = req.body;
    const validationErrors = [];
    const allowedValues = [
      "Company Name",
      "Warehouse",
      "Reference ID",
      "Product",
      "Quantity",
    ];

    if (productInwards.length > BULK_PRODUCT_LIMIT) {
      validationErrors.push(
        `Cannot add productInward above ${BULK_PRODUCT_LIMIT}`
      );
    } else if (productInwards.length === 0) {
      return res.sendError(
        httpStatus.CONFLICT,
        "Cannot add empty sheet",
        `Failed to add Bulk Products`
      );
    }

    let row = 2;
    for (const productInward of productInwards) {
      Object.keys(productInward).forEach((item) => {
        if (!allowedValues.includes(item)) {
          validationErrors.push(`Field ${item} is invalid`);
        }
      });
    }

    if (validationErrors.length) {
      return res.sendError(
        httpStatus.CONFLICT,
        validationErrors,
        `Failed to add Bulk Products`
      );
    }

    let [companies, warehouses, products] = await Promise.all([
      getCustomers(productInwards),
      getWarehouses(productInwards),
      getProducts(productInwards),
    ]);

    productInwards = productInwards.map((productInward) => {
      const company = companies.find(
        (company) => company.name === productInward["Company Name"]
      );
      const warehouse = warehouses.find(
        (warehouse) => warehouse.name === productInward["Warehouse"]
      );
      const product = products.find(
        (product) => product.name === productInward["Product"]
      );

      productInward = {
        internalIdForBusiness: company ? company.internalIdForBusiness : null,
        customerId: company ? company.id : null,
        warehouseId: warehouse ? warehouse.id : null,
        referenceId: productInward["Reference ID"],
        productId: product ? product.id : null,
        quantity: productInward["Quantity"],
        userId: req.userId,
      };

      if (!productInward["warehouseId"])
        validationErrors.push(`Row ${row} : warehouseId name cannot be empty.`);
      if (!productInward["referenceId"])
        validationErrors.push(`Row ${row} : referenceId name cannot be empty.`);
      if (!productInward["customerId"])
        validationErrors.push(`Row ${row} : customer name not found.`);
      if (!productInward["quantity"])
        validationErrors.push(`Row ${row} : quantity name cannot be empty.`);
      if (!productInward["productId"])
        validationErrors.push(`Row ${row} : product name cannot be invalid.`);

      row++;

      return productInward;
    });

    if (validationErrors.length) {
      return res.sendError(
        httpStatus.CONFLICT,
        validationErrors,
        "Failed to add bulk Product Inwards"
      );
    }

    productInwards = productInwards.reduce((inward, item) => {
      inward[item.referenceId] = inward[item.referenceId] || [];
      inward[item.referenceId].push(item);

      return inward;
    }, Object.create(null));

    await sequelize.transaction(async (transaction) => {
      return Promise.each(
        Object.values(productInwards),
        async (productInwardGroup) => {
          const inward = await ProductInward.create(productInwardGroup[0], {
            transaction,
          });

          const numberOfinternalIdForBusiness = digitize(inward.id, 6);
          inward.internalIdForBusiness =
            productInwardGroup[0].internalIdForBusiness +
            numberOfinternalIdForBusiness;

          await inward.save({ transaction });

          return Promise.each(productInwardGroup, async (productInward) => {
            productInward.inwardId = inward.id;

            await InwardGroup.create(productInward, { transaction });

            const inventory = await Inventory.findOne({
              where: {
                customerId: productInward.customerId,
                warehouseId: productInward.warehouseId,
                productId: productInward.productId,
              },
            });

            if (!inventory) {
              return Inventory.create(
                {
                  customerId: productInward.customerId,
                  warehouseId: productInward.warehouseId,
                  productId: productInward.productId,
                  availableQuantity: productInward.quantity,
                  referenceId: productInward.referenceId,
                  totalInwardQuantity: productInward.quantity,
                },
                { transaction }
              );
            }

            inventory.availableQuantity += +productInward.quantity;
            inventory.totalInwardQuantity += +productInward.quantity;

            return inventory.save({ transaction });
          });
        }
      );
    });

    return res.json({
      success: true,
      message: "Operation completed successfully",
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
    });
  }
});

/* Get bulk upload template. */
router.get("/bulk-template", async (req, res, next) => {
  let workbook = new ExcelJS.Workbook();

  let worksheet = workbook.addWorksheet("ProductInwards");

  const getColumnsConfig = (columns) =>
    columns.map((column) => ({
      header: column,
      width: Math.ceil(column.length * 1.5),
      outlineLevel: 1,
    }));

  worksheet.columns = getColumnsConfig([
    "Company Name",
    "Warehouse",
    "Reference ID",
    "Product",
    "Quantity",
  ]);

  worksheet.addRows(
    [
      {
        "Company Name": "Test Company 1",
        Warehouse: "Warehouse 1.0",
        "Reference ID": "4971660912",
        Product: "Milkpak 1 litre",
        Quantity: 11,
      },
      {
        "Company Name": "Test Company 1",
        Warehouse: "Warehouse 1.0",
        "Reference ID": "4971660912",
        Product: "Orange",
        Quantity: 11,
      },
    ].map((el, idx) => [
      el["Company Name"],
      el.Warehouse,
      el["Reference ID"],
      el.Product,
      el.Quantity,
    ])
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + "Inventory.xlsx"
  );

  await workbook.xlsx.write(res).then(() => res.end());
});

function getProducts(productInwards) {
  const products = productInwards.map((inward) => inward["Product"]);

  if (!products || !products.length) {
    return [];
  }

  return Product.findAll({
    where: {
      name: {
        [Op.in]: products,
      },
    },
  });
}

function getWarehouses(productInwards) {
  const warehouses = productInwards.map((inward) => inward["Warehouse"]);

  if (!warehouses || !warehouses.length) {
    return [];
  }

  return Warehouse.findAll({
    where: {
      name: {
        [Op.in]: warehouses,
      },
    },
  });
}

function getCustomers(productInwards) {
  const companies = productInwards.map((inward) => inward["Company Name"]);

  if (!companies || !companies.length) {
    return [];
  }

  return Company.findAll({
    where: {
      name: {
        [Op.in]: companies,
      },
    },
  });
}

module.exports = router;
