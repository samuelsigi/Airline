const Approval = require('../model/Approval');
const SeatClass = require('../model/SeatClass');
const Flight = require('../model/Flight');
const HttpError = require('../model/http-error');

// Get all pending approvals
exports.getAllPendingApprovals = async (req, res, next) => {
  try {
    const pendingApprovals = await Approval.find({ approval: 'Pending' });
    if (!pendingApprovals || pendingApprovals.length === 0) {
      return next(new HttpError('No pending approvals found.', 404));
    }
    res.status(200).json({ approvals: pendingApprovals });
  } catch (err) {
    return next(new HttpError('Fetching pending approvals failed, please try again.', 500));
  }
};

// Approve a specific request
exports.approveRequest = async (req, res, next) => {
  const approvalId = req.params.id;

  try {
    const approval = await Approval.findById(approvalId);
    if (!approval) {
      return next(new HttpError('Approval request not found.', 404));
    }

    // Update the approval status and set the approval date
    approval.approval = 'Approved';
    approval.approvedOn = Date.now();

    // Update the seat class status if the approval is for a seat class
    if (approval.name === 'SeatClass') {
      const seatClass = await SeatClass.findById(approval.updatingId);
      if (!seatClass) {
        return next(new HttpError('Associated SeatClass not found.', 404));
      }
      seatClass.status = 'Approved';
      await seatClass.save();
    }

    // Update the flight status if the approval is for a flight
    if (approval.name === 'Flight') {
        const flight = await Flight.findById(approval.updatingId);
        if (!flight) {
          return next(new HttpError('Associated Flight not found.', 404));
        }
        flight.status = 'Approved';
        await flight.save();
      }

    await approval.save();
    res.status(200).json({ message: 'Approval request approved successfully.' });
  } catch (err) {
    return next(new HttpError('Approving request failed, please try again later.', 500));
  }
};

// Reject a specific request
exports.rejectRequest = async (req, res, next) => {
  const approvalId = req.params.id;

  try {
    const approval = await Approval.findById(approvalId);
    if (!approval) {
      return next(new HttpError('Approval request not found.', 404));
    }

    // Update the approval status to 'Rejected' and set the approval date
    approval.approval = 'Rejected';
    approval.approvedOn = Date.now();
    await approval.save();

    res.status(200).json({ message: 'Approval request rejected successfully.' });
  } catch (err) {
    return next(new HttpError('Rejecting request failed, please try again later.', 500));
  }
};


// Get all approvals categorized by status
exports.getAllApprovals = async (req, res, next) => {
    try {
      // Fetch all approvals
      const approvals = await Approval.find();
  
      // Separate approvals based on status
      const categorizedApprovals = {
        pending: approvals.filter(approval => approval.approval === "Pending"),
        approved: approvals.filter(approval => approval.approval === "Approved"),
        rejected: approvals.filter(approval => approval.approval === "Rejected"),
        deleted: approvals.filter(approval => approval.approval === "Deleted")
      };
  
      res.status(200).json({ approvals: categorizedApprovals });
    } catch (err) {
      return next(new HttpError('Fetching approvals failed, please try again later.', 500));
    }
  };
  