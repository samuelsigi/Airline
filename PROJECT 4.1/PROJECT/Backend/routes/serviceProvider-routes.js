const express = require('express');
const ServiceProvider = require('../controllers/serviceProvider-controller');
const { check } = require('express-validator');
const logoUpload = require('../middleware/logo-upload')
const router = express.Router();

// Route for Service Provider signup with separate file upload for logo
router.post('/signup',logoUpload.single('logo'), 
    [
      check('name').not().isEmpty(),
      check('email').normalizeEmail().isEmail(),
      check('password').isLength({ min: 6 }),
      check('phone').not().isEmpty()
    ],
    ServiceProvider.signupServiceProvider);

router.post('/login', ServiceProvider.loginServiceProvider);
router.get('/:spid', ServiceProvider.getServiceProvider);

// Route to get all users
router.get('/', ServiceProvider.getAllServiceProvider);

router.patch('/:spid', ServiceProvider.updateServiceProvider);
router.delete('/:spid', ServiceProvider.deleteServiceProvider);

module.exports = router;
