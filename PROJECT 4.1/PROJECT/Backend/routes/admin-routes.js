const express = require('express');
const approvalController = require('../controllers/admin-controller');

const router = express.Router();

// Route to get all pending approvals
router.get('/pending', approvalController.getAllPendingApprovals);

// Route to approve a specific approval request
router.patch('/:id/approve', approvalController.approveRequest);

// Route to reject a specific approval request
router.patch('/:id/reject', approvalController.rejectRequest);

// Route to get all approvals categorized by status
router.get('/all', approvalController.getAllApprovals);

module.exports = router;
