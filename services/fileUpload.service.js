const AWS = require('aws-sdk');
const multer = require('multer')
const multerS3 = require('multer-s3')
const env = require('dotenv').config();

exports.fileUploading = ()=>{
var s3 = new AWS.S3({ 
  accessKeyId: IAM_USER_KEY,
  secretAccessKey: IAM_USER_SECRET,
  Bucket: BUCKET_NAME
 })
var upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString())
    }
  })
})
}
