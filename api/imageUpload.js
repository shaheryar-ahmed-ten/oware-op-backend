const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const multer = require('multer')
const multerS3 = require('multer-s3')
const { v4 } = require('uuid');
const path = require('path')
require('dotenv').config();
const { File } = require('../models')
const s3 = new aws.S3({
    secretAccessKey: process.env.IAM_USER_SECRET,
    accessKeyId: process.env.IAM_USER_KEY,
})
const maxSize = 2 * 1024 * 1024; //2mb
router.post('/',async (req, res, next) => { 
    const bucket = req.query.bucket
    var upload = multer({
        storage: multerS3({
            s3: s3,
            bucket,
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            key: function (req, file, cb) {
                cb(null, v4()+path.extname(file.originalname))}
        }),
        limits: { fileSize: maxSize }
    }).single('image')

    upload(req, res,async function (err) {
        if (err instanceof multer.MulterError) {
          res.json(err.message)
        } else if (err) {
          res.json(err.message)
        }
        const file = await File.create({
            originalName : req.file.originalname,
            ...req.file
        })
        res.json(file)
      })
})

module.exports = router;
