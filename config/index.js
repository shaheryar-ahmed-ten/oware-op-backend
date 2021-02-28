const env_config = require('dotenv').config();
const env = process.env.NODE_ENV || 'development';
const config = require('./config.json')[env];
module.exports = { ...env_config.parsed, ...config };