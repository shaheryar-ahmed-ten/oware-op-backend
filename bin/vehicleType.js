// "use strict";
// const { Model } = require("sequelize");
// const config = require("../config");
// module.exports = (sequelize, DataTypes) => {
//   class VehicleType extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//       VehicleType.hasMany(models.Car, {
//         foreignKey: "vehicleTypeId",
//       });
//     }
//   }
//   VehicleType.init(
//     {
//       name: {
//         type: DataTypes.STRING,
//         unique: true,
//         allowNull: false,
//         validate: { notEmpty: { msg: "Please enter a make name" } },
//       },
//     },
//     {
//       sequelize,
//       paranoid: true,
//       modelName: "VehicleType",
//       timestamps: true,
//     }
//   );
//   return VehicleType;
// };
