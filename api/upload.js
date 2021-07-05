const express = require('express');
const router = express.Router();
const multer = require('multer')
const multerS3 = require('multer-s3');
const { v4 } = require('uuid');
const path = require('path')
const { File } = require('../models');
const { s3 } = require('../services/s3.service');
const {
  maxSize,
  bucket
} = require('../config');

router.post('/:folder', async (req, res, next) => {
  const folder = req.params.folder;
  var upload = multer({
    storage: multerS3({
      s3,
      bucket,
      metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (req, file, cb) {
        cb(null, folder + '/' + v4() + path.extname(file.originalname))
      }
    }),
    limits: { fileSize: maxSize }
  }).single('image');

  upload(req, res, async function (err) {
    if (err) {
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
    const file = await File.create({
      originalName: req.file.originalname,
      ...req.file
    })
    res.json({
      success: true,
      file
    });
  });
})

module.exports = router;
