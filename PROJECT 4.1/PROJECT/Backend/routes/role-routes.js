const express = require('express');
const roleController = require('../controllers/role-controller');
const router = express.Router();

router.post('/', roleController.createRole);

router.get('/:rid', roleController.getRoleById);
router.get('/', roleController.getAllRoles);

router.patch('/:rid', roleController.updateRole);
router.delete('/:rid', roleController.deleteRole);

module.exports = router;
