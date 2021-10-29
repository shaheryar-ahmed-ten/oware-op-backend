module.exports = Object.freeze({
  PORTALS: {
    OPERATIONS: "OPERATIONS",
    CUSTOMER: "CUSTOMER",
  },
  CUSTOMER_TYPES: {
    MANUFACTURER: "MANUFACTURER",
    DISTRIBUTOR: "DISTRIBUTOR",
    IMPORTER: "IMPORTER",
    TRADER: "TRADER",
    WHOLESALER: "WHOLESALER",
    RETAILER: "RETAILER",
  },
  RELATION_TYPES: {
    VENDOR: "VENDOR",
    CUSTOMER: "CUSTOMER",
  },
  RIDE_STATUS: {
    UNASSIGNED: "UNASSIGNED",
    ASSIGNED: "ASSIGNED",
    INPROGRESS: "INPROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  },
  PERMISSIONS: {
    OPS_USER_FULL: "OPS_USER_FULL",
    OPS_CUSTOMER_FULL: "OPS_CUSTOMER_FULL",
    OPS_CATEGORY_FULL: "OPS_CATEGORY_FULL",
    OPS_UOM_FULL: "OPS_UOM_FULL",
    OPS_BRAND_FULL: "OPS_BRAND_FULL",
    OPS_WAREHOUSE_FULL: "OPS_WAREHOUSE_FULL",
    OPS_PRODUCT_FULL: "OPS_PRODUCT_FULL",
    OPS_PRODUCTINWARD_FULL: "OPS_PRODUCTINWARD_FULL",
    OPS_DISPATCHORDER_FULL: "OPS_DISPATCHORDER_FULL",
    OPS_PRODUCTOUTWARD_FULL: "OPS_PRODUCTOUTWARD_FULL",
    OPS_INVENTORY_FULL: "OPS_INVENTORY_FULL",
    OPS_CUSTOMERINQUIRY_FULL: "OPS_CUSTOMERINQUIRY_FULL",
  },
  ROLES: {
    CUSTOMER_SUPER_ADMIN: "CUSTOMER_SUPER_ADMIN",
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
  },
  VEHICLE_TYPES: {
    BIKE: "BIKE",
    MINI_TRUCK: "MINI_TRUCK",
    LIGHT_TRUCK: "LIGHT_TRUCK",
    HEAVY_TRUCK: "HEAVY_TRUCK",
    REFREGERATED_TRUCK: "REFREGERATED_TRUCK",
  },
  DISPATCH_ORDER: {
    STATUS: {
      PENDING: 0,
      PARTIALLY_FULFILLED: 1,
      FULFILLED: 2,
      CANCELLED: 3,
    },
  },
  initialInternalIdForBusinessForAdjustment: "SA-",
  BULK_PRODUCT_LIMIT: 200,
  SPECIAL_CHARACTERS: /[!@#$%^\=\[\]{};:\\|>\/?]/,
  INTEGER_REGEX: /^[0-9]*$/,
});
