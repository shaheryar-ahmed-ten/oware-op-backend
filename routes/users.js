var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.json({
    success: true,
    message: 'respond with a resource'
  });
});

module.exports = router;
