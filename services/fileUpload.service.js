const AWS = require('aws-sdk');
const multer = require('multer')
const multerS3 = require('multer-s3')

exports.fileUploading = (Bucket,upload)=>{
var s3 = new AWS.S3({ 
  accessKeyId: IAM_USER_KEY,
  secretAccessKey: IAM_USER_SECRET,
  Bucket
 })
 return upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: Bucket,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
})
}
