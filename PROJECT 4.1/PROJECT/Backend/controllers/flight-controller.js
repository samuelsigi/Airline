const fs = require('fs');
const path = require('path');
const Approval = require('../model/Approval');
const Flight = require('../model/Flight');
const SeatClass = require('../model/SeatClass');
const ServiceProvider = require('../model/Service-Provider');
const HttpError = require('../model/http-error');

// Get all flights
exports.getAllFlights = async (req, res, next) => {
    try {
        const flights = await Flight.find();

        if (!flights || flights.length === 0) {
            return next(new HttpError('No flights found.', 404));
        }

        res.json({ flights: flights.map(flight => flight.toObject({ getters: true })) });
    } catch (err) {
        return next(new HttpError('Fetching flights failed, please try again later.', 500));
    }
};

// Create a new flight
exports.createFlight = async (req, res, next) => {
    const { airline, origin, destination, departureTime, arrivalTime, duration, luggageCapacity, flightNumber, recurrence, serviceProviderId } = req.body; // Take flightNumber from the request body
    const image = req.file ? req.file.path : null;
    console.log(req.body)

    if (!image) {
        return next(new HttpError('No image provided.', 422));
    }

    const imagePath = req.file.path.replace(/\\/g, '/');

    try {
        
        // Referenced seat model exists based on flightNumber (seatClassName)
        const seatClass = await SeatClass.findOne({ seatClassName: flightNumber }); // Find the seat class using flightNumber
        if (!seatClass) {
            return next(new HttpError('Seat class not found for the provided flight number.', 404));
        }

        // Find the service provider
        const serviceProvider = await ServiceProvider.findById(serviceProviderId);
        if (!serviceProvider) {
        return next(new HttpError('Service provider not found.', 404));
        }

        const newFlight = new Flight({
            flightNumber,
            airline:serviceProvider.name,
            origin,
            destination,
            departureTime,
            arrivalTime,
            duration,
            luggageCapacity,
            seatModel: seatClass._id, // Store the seat model ID for reference
            image: 'http://localhost:4000/' + imagePath,
            recurrence
        });


        await newFlight.save();

        // Add the flight to the service provider's flights array
        serviceProvider.flights.push(newFlight._id);
        await serviceProvider.save();

        // Create an approval request for the new flight
        const approvalRequest = new Approval({
            serviceProvider: serviceProviderId,
            name: 'Flight', // Specify that this is a flight approval
            updatingId: newFlight._id.toString(),
            approval: 'Pending', // Set initial status to 'Pending'
            requestedOn: Date.now() // Automatically sets to current date and time
        });
  
      await approvalRequest.save();

        res.status(201).json({ message: 'Flight successfully created', flight: newFlight.toObject({ getters: true }) });
    } catch (err) {
        // Check for duplicate key error (MongoDB error code for duplicate key is 11000)
        if (err.code === 11000 && err.keyPattern && err.keyPattern.flightNumber) {
            return next(new HttpError('Flight number already exists. Please use a unique flight number.', 409));
        }

        console.log(err);
        return next(new HttpError('Flight creation failed, please try again.', 500));
    }
};



// Get a flight by ID
exports.getFlightById = async (req, res, next) => {
    const flightId = req.params.fid;

    try {
        const flight = await Flight.findById(flightId);
        if (!flight) {
            return next(new HttpError('Flight not found.', 404));
        }
        res.json({ flight: flight.toObject({ getters: true }) });
    } catch (err) {
        return next(new HttpError('Fetching flight failed, please try again later.', 500));
    }
};


// Update flight
exports.updateFlight = async (req, res, next) => {
    const flightId = req.params.fid;
    const { flightNumber, airline, origin, destination, departureTime, arrivalTime, duration, luggageCapacity, recurrence } = req.body;

    console.log(req.body) // returns null in form data

    try {
        const flight = await Flight.findById(flightId);
        if (!flight) {
            return next(new HttpError('Flight not found.', 404));
        }

        // Update basic flight information
        flight.flightNumber = flightNumber || flight.flightNumber;
        flight.airline = airline || flight.airline;
        flight.origin = origin || flight.origin;
        flight.destination = destination || flight.destination;
        flight.departureTime = departureTime || flight.departureTime;
        flight.arrivalTime = arrivalTime || flight.arrivalTime;
        flight.duration = duration || flight.duration;
        flight.luggageCapacity = luggageCapacity || flight.luggageCapacity;

        flight.recurrence = recurrence || flight.recurrence;
        flight.status = "Awaiting Approval for Updating Flight";


        // Update seat model based on flightNumber if flightNumber is changed
        if (flightNumber && flightNumber !== flight.flightNumber) {
            const seatModel = await SeatClass.findOne({ seatClassName: flightNumber });
            if (!seatModel) {
                return next(new HttpError('Seat model not found for the provided flight number.', 404));
            }
            flight.seatModel = seatModel._id;
        }

        await flight.save();

        // Remove any pending approval requests for adding the flights
        await Approval.deleteMany({ updatingId: flightId, approval: "Pending" });

        // Create a new approval request for the updated flights
        const approvalRequest = new Approval({
        serviceProvider: flightId.toString(), 
        name: "Flight",
        updatingId: flightId,
        approval: "Pending",
        requestedOn: new Date()
        });

        await approvalRequest.save();

        res.status(200).json({ message: 'Flight updated successfully', flight: flight.toObject({ getters: true }) });
    } catch (err) {
        console.error(err);
        return next(new HttpError('Updating flight failed, please try again.', 500));
    }
};


// Delete flight
exports.deleteFlight = async (req, res, next) => {
    const flightId = req.params.fid;

    try {
        const flight = await Flight.findById(flightId);
        if (!flight) {
            return next(new HttpError('Flight not found.', 404));
        }

        // Find the latest approval for this flight
        const latestApproval = await Approval.findOne({ updatingId: flightId }).sort({ requestedOn: -1 });

        if (latestApproval) {
        // Update the latest approval to show it as deleted
        latestApproval.approval = "Deleted";
        await latestApproval.save();

        // Delete any other pending approvals for this seat class
        await Approval.deleteMany({ updatingId: flightId, _id: { $ne: latestApproval._id }, approval: "Pending" });
        }


        if (flight.image) {
            // Extract the relative path from the URL
            const imagePath = flight.image.replace(/^http:\/\/localhost:4000/, ''); // This gets the relative path
      
            // Construct the absolute path
            const absolutePath = path.join('images', '..', imagePath); 
      
            fs.unlink(absolutePath, (err) => {
              if (err) {
                console.error('Failed to delete image:', err);
              }
            });
          }

        await flight.deleteOne();

        res.status(200).json({ message: 'Flight deleted successfully' });
    } catch (err) {
        console.log(err);
        return next(new HttpError('Deleting flight failed, please try again.', 500));
    }
};

exports.searchFlights = async (req, res, next) => {
    const { origin, destination, seatClass, date } = req.body; 

    let flights;
    try {
        const query = {};

        if (origin) query.origin = origin;
        if (destination) query.destination = destination;

        // Date handling for the query (if date is provided)
        let dayOfWeek;
        if (date) {
            const startOfDay = new Date(date);
            const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            dayOfWeek = dayMap[startOfDay.getDay()]; // Get day name from date
        }

        // Recurrence filter based on the date's day of the week
        if (dayOfWeek) {
            const recurrenceOptions = [
                "Daily",
                (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") ? "Weekends" : null,
                ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].includes(dayOfWeek) ? "Weekly:(Mon - Fri)" : null,
                `Weekly:${dayOfWeek}`
            ].filter(Boolean); // Remove any null values from the array

            query.recurrence = { $in: recurrenceOptions };
        }


        if (seatClass){
            const seatClasses = await SeatClass.find();

            // Check if seatClasses is empty
            if (!seatClasses || seatClasses.length === 0) {
                return res.status(404).json({ message: 'No seat classes found.' });
            }

            // Initialize an array for seat models and a variable for seat prices
            let seatModelIds = [];
            let availabilityMessages = [];

            // Loop through each seat class document and check availability
            for (const classDoc of seatClasses) {
                if (seatClass === "Economy" && classDoc.economyavailableSeats > 0) {
                    seatModelIds.push(classDoc._id.toString());
                } else if (seatClass === "Business" && classDoc.businessavailableSeats > 0) {
                    seatModelIds.push(classDoc._id.toString());
                } else if (seatClass === "First" && classDoc.firstClassavailableSeats > 0) {
                    seatModelIds.push(classDoc._id.toString());
                } else if (seatClass && !seatModelIds.length) {
                    availabilityMessages.push(`No available seats in ${seatClass} class.`);
                }
            }

            // If no available seat models found, respond with an error message
            if (seatModelIds.length === 0) {
                return res.status(404).json({ message: availabilityMessages.join(' ') });
            }

            // Assign the seat model IDs to the query
            query.seatModel = { $in: seatModelIds }; // Allow for multiple seat models

        }
        console.log("Query being built:", query); // Log the constructed query for debugging

        // Fetch flights based on the constructed query
        flights = await Flight.find(query).populate('seatModel');

        if (!flights || flights.length === 0) {
            return res.status(404).json({ message: 'No flights found for the given criteria.' });
        }

    } catch (err) {
        console.error(err); // Log error for debugging
        return next(new HttpError('Searching flights failed: ' + err.message, 500));
    }

    // Return the found flights
    res.json({ flights: flights.map(flight => flight.toObject({ getters: true })) });
};