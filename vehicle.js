// 'use strict';
// const {
//   Model
// } = require('sequelize');
// const config = require('../config');
// module.exports = (sequelize, DataTypes) => {
//   class Vehicle extends Model {
//     /**
//      * Helper method for defining associations.
//      * This method is not a part of Sequelize lifecycle.
//      * The `models/index` file will call this method automatically.
//      */
//     static associate(models) {
//       // define association here
//       Vehicle.belongsTo(model.productOutward,{
//         foreignKey:productOutwardId
//       })
//     }
//   };
//   Vehicle.init({
//     vehicleNumber: {
//       type: DataTypes.STRING,
//       unique: true,
//       allowNull:false,
//       validate: { notEmpty: { msg: 'Please enter a vehicle number' } }

//     },
//     vehicleType: DataTypes.ENUM({
//         values: config.vehicleTypes
//       }),
//       allowNull: false,
//       validate: { notEmpty: { msg: 'Please select vehicle type' } }

//   }, {
//     sequelize,
//     paranoid: true,
//     modelName: 'Vehicle',
//   }).sync();
//   return Vehicle;
// };