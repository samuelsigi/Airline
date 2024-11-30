const SeatClass = require('../model/SeatClass');
const ServiceProvider = require('../model/Service-Provider');
const Approval = require('../model/Approval'); // Import the Approval model
const HttpError = require('../model/http-error');

// Get all seat classes
exports.getAllSeatClasses = async (req, res, next) => {
    try {
      const seatClasses = await SeatClass.find();
      if (!seatClasses || seatClasses.length === 0) {
          return next(new HttpError('No Seat Classes found.', 404));
        }
    
      res.status(200).json({ seatClasses });
    } catch (err) {
      return next(new HttpError('Fetching seat classes failed, please try again later.', 500));
    }
  };

// Create a new seat class entry
exports.createSeatClass = async (req, res, next) => {
  const { seatClassName, economySeats, economySeatPrice, economyFoodPrice, economyavailableSeats,
          businessSeats, businessSeatPrice, businessFoodPrice, businessavailableSeats,
          firstClassSeats, firstClassSeatPrice, firstClassFoodPrice, firstClassavailableSeats,serviceProviderId } = req.body;


  console.log(req.body) // formdata is not working for creation also


  const totalSeats = economySeats + businessSeats + firstClassSeats;
  const totalAvailableSeats = economyavailableSeats + businessavailableSeats + firstClassavailableSeats;

  const newSeatClass = new SeatClass({
    seatClassName,
    economySeats,
    economySeatPrice,
    economyFoodPrice,
    economyavailableSeats,
    businessSeats,
    businessSeatPrice,
    businessFoodPrice,
    businessavailableSeats,
    firstClassSeats,
    firstClassSeatPrice,
    firstClassFoodPrice,
    firstClassavailableSeats,
    totalSeats,
    totalAvailableSeats
  });

  try {
      // Check if the seat class already exists
    const existingSeatClass = await SeatClass.findOne({ seatClassName });
    if (existingSeatClass) {
      return next(new HttpError('Seat class already exists, please check again.', 422));
    }

    // Find the service provider
    const serviceProvider = await ServiceProvider.findById(serviceProviderId);
    if (!serviceProvider) {
      return next(new HttpError('Service provider not found.', 404));
    }

    // Save the new seat class
    await newSeatClass.save();

    // Add the seat class to the service provider's seatClass array
    serviceProvider.seatClass.push(newSeatClass._id);
    await serviceProvider.save();

    // Create an approval request for the new seat class
    const approvalRequest = new Approval({
      serviceProvider: serviceProviderId,
      name: 'SeatClass', // Specify that this is a seat class approval
      updatingId: newSeatClass._id.toString(),
      approval: 'Pending', // Set initial status to 'Pending'
      requestedOn: Date.now() // Automatically sets to current date and time
    });

    await approvalRequest.save();

    res.status(201).json({ seatClass: newSeatClass });
  } catch (err) {
    return next(new HttpError('Creating seat class failed, please try again.', 500));
  }
};



// Get a single seat class by ID
exports.getSeatClassById = async (req, res, next) => {
  const seatClassId = req.params.id;

  try {
    const seatClass = await SeatClass.findById(seatClassId);
    if (!seatClass) {
      return next(new HttpError('Seat class not found.', 404));
    }
    res.status(200).json({ seatClass });
  } catch (err) {
    return next(new HttpError('Fetching seat class failed, please try again later.', 500));
  }
};




// Update a seat class by ID and create an approval request
exports.updateSeatClass = async (req, res, next) => {
  const seatClassId = req.params.id;
  const updates = req.body;

  try {
    const seatClass = await SeatClass.findById(seatClassId);
    if (!seatClass) {
      return next(new HttpError('Seat class not found.', 404));
    }

    // Apply updates to the seat class
    Object.assign(seatClass, updates);
    seatClass.totalSeats = seatClass.economySeats + seatClass.businessSeats + seatClass.firstClassSeats;
    seatClass.totalAvailableSeats = seatClass.economyavailableSeats + seatClass.businessavailableSeats + seatClass.firstClassavailableSeats;
    seatClass.status = "Approved";
    
    await seatClass.save();

    // Remove any pending approval requests for adding the seat class
    await Approval.deleteMany({ updatingId: seatClassId, approval: "Pending" });

    // Create a new approval request for the updated seat class
    const approvalRequest = new Approval({
      serviceProvider: seatClassId.toString(),
      name: "SeatClass",
      updatingId: seatClassId,
      approval: "Pending",
      requestedOn: new Date()
    });

    await approvalRequest.save();
    
    res.status(200).json({ message: 'Seat Class updated successfully',seatClass });
  } catch (err) {
    return next(new HttpError('Updating seat class failed, please try again later.', 500));
  }
};


// Delete a seat class by ID and mark the latest approval as deleted
exports.deleteSeatClass = async (req, res, next) => {
  const seatClassId = req.params.id;

  try {
    const seatClass = await SeatClass.findById(seatClassId);
    if (!seatClass) {
      return next(new HttpError('Seat class not found.', 404));
    }

    // Find the latest approval for this seat class
    const latestApproval = await Approval.findOne({ updatingId: seatClassId }).sort({ requestedOn: -1 });

    if (latestApproval) {
      // Update the latest approval to show it as deleted
      latestApproval.approval = "Deleted";
      await latestApproval.save();

      // Delete any other pending approvals for this seat class
      await Approval.deleteMany({ updatingId: seatClassId, _id: { $ne: latestApproval._id }, approval: "Pending" });
    }

    await seatClass.deleteOne();
    res.status(200).json({ message: 'Seat class deleted successfully, and approvals updated.' });
  } catch (err) {
    return next(new HttpError('Deleting seat class failed, please try again later.', 500));
  }
};

