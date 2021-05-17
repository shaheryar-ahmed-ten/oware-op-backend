const express = require("express");
const router = express.Router();
const { CustomerInquery } = require("../models");
const authService = require('../services/auth.service');
const config = require('../config');


/* GET customers inquery listing. */
router.get('/', authService.isLoggedIn,async (req, res, next) => {
    const limit = req.query.rowsPerPage || config.rowsPerPage
    const offset = (req.query.page - 1 || 0) * limit;
    let where = {
    };
    const response = await CustomerInquery.findAndCountAll({
      orderBy: [['updatedAt', 'DESC']],
      limit, offset, where
    });
    res.json({
      success: true,
      message: 'respond with a resource',
      data: response.rows,
      pages: Math.ceil(response.count / limit)
    });
  });

module.exports = router;
