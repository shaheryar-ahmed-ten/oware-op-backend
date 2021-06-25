const express = require('express');
const router = express.Router();
const aws = require('aws-sdk');
const multer = require('multer')
const multerS3 = require('multer-s3')
const { uuid } = require('uuidv4');
require('dotenv').config();
const s3 = new aws.S3({
    secretAccessKey: process.env.IAM_USER_SECRET,
    accessKeyId: process.env.IAM_USER_KEY,
})
var upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'owaredevuploads/vehicle/',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            cb(null, Date.now().toString())}
    })
})
//var upload = multer({ dest: 'uploads/' })
router.post('/', upload.single('image'),async (req, res, next) => { 
    const file = req.file
    console.log(file)
})

module.exports = router;
