const multer = require('multer');
const {v4:uuidv4} = require('uuid');


const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
}


// creating the middleware
const userImageUpload = multer({
    limit: 5000000,//5000kb
    // limit: 500000,//500kb
    storage: multer.diskStorage({
        // configuration for path
        destination: (req,file,cb)=>{
            cb(null, 'uploads/images/user')
        },
        // configuration for filename
        filename :(req,file,cb)=>{
            const ext = MIME_TYPE_MAP[file.mimetype]
            cb(null,uuidv4()+'.'+ext)
        }
    }),
    // to validate that we are getting an invalid file
    // adding wrong file should not be possible
    fileFilter: (req,file,cb)=>{
        // !!means converting to true or false
        const isValid = !!MIME_TYPE_MAP[file.mimetype]
        let error = isValid ? null: new Error('invalid mime type!')
        cb(error,isValid)
    }  

})

// export the middleware
module.exports = userImageUpload;
