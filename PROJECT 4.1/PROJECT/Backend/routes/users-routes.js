const express = require('express');
const userController = require('../controllers/user-controller');
const { check } = require('express-validator');
const userImageUpload = require('../middleware/userimage-upload');  // Multer file upload middleware
const router = express.Router();

router.post(
  '/signup',
  userImageUpload.single('image'),  // Handle image upload
  [
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 }),
    check('phone').not().isEmpty()
  ],
  userController.signupUser
);

router.post('/login', userController.loginUser);
router.get('/:uid', userController.getUser);

// Route to get all users
router.get('/', userController.getAllUsers);
// Route to get all customers
router.get('/all/customer', userController.getAllCustomer);
// Route to get all admins
router.get('/all/admin', userController.getAllAdmin);


router.patch('/:uid', userController.updateUser);
router.delete('/:uid', userController.deleteUser);

module.exports = router;
