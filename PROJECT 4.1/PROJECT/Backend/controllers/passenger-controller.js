const fs = require('fs');
const path = require('path');
const Passenger = require('../model/Passengers');
const HttpError = require('../model/http-error');

// Get all passengers
exports.getAllPassengers = async (req, res, next) => {
    try {
        const passengers = await Passenger.find();
        if (!passengers || passengers.length === 0) {
            return next(new HttpError('No Passenger to show.', 404));
        }
        res.json({ passengers: passengers.map(passenger => passenger.toObject({ getters: true })) });
    } catch (err) {
        return next(new HttpError('Fetching passengers failed, please try again later.', 500));
    }
};


exports.createPassenger = async (req, res, next) => {
    const { name, age, gender, phone, seatClass, food, type } = req.body; 
    console.log(req.body)

    try {
        // Check if a passenger with the same name, age, gender, and phone already exists
        const existingPassenger = await Passenger.findOne({ name, age, gender });
        if (existingPassenger) {
            // Delete the existing passenger record
            await existingPassenger.deleteOne();
        }

        // Validate seat class, food, and type inputs
        if (!['Economy', 'Business', 'First'].includes(seatClass)) {
            return next(new HttpError('Invalid seat class. Must be one of: Economy, Business, First.', 400));
        }
        if (!['Yes', 'No'].includes(food)) {
            return next(new HttpError('Please select your choice of food.', 400));
        }
        if (!['Normal', 'Student', 'Senior Citizen', 'Disabled', 'Army', 'Doctor'].includes(type)) {
            return next(new HttpError('Please select one: Student, Senior Citizen, Disabled, Army, Doctor, or Normal.', 400));
        }

        // Create a new passenger record
        const newPassenger = new Passenger({
            name,
            age,
            gender,
            phone,
            seatClass,
            food,
            type,
        });

        await newPassenger.save();
        res.status(201).json({ message: 'Passenger created successfully', passenger: newPassenger.toObject({ getters: true }) });
    } catch (err) {
        console.log(err);
        return next(new HttpError('Creating or updating passenger failed, please try again.', 500));
    }
};


// Get passenger by ID
exports.getPassengerById = async (req, res, next) => {
    const passengerId = req.params.pid;

    try {
        const passenger = await Passenger.findById(passengerId);
        if (!passenger) {
            return next(new HttpError('Passenger not found.', 404));
        }
        res.json({ passenger: passenger.toObject({ getters: true }) });
    } catch (err) {
        return next(new HttpError('Fetching passenger failed, please try again later.', 500));
    }
};


// Update passenger by ID
exports.updatePassenger = async (req, res, next) => {
    const passengerId = req.params.pid;
    const { name, age, phone, seatClass, food} = req.body;

    // Validate seat class
    if (!['Economy', 'Business', 'First'].includes(seatClass)) {
        return next(new HttpError('Invalid seat class. Must be one of: Economy, Business, First.', 400));
    }

    if (!['Yes', 'No'].includes(food)) {
        return next(new HttpError('Please select your choice of food.', 400));
    }

    try {
        const passenger = await Passenger.findById(passengerId);
        if (!passenger) {
            return next(new HttpError('Passenger not found.', 404));
        }

        // Update fields, only if they are provided in the request body
        if (name) passenger.name = name;
        if (age) passenger.age = age;
        if (phone) passenger.phone = phone; // Update only if provided
        passenger.seatClass = seatClass; // Seat class is mandatory
        passenger.food = food; // Food choice is mandatory

        await passenger.save();
        res.status(200).json({ message: 'Passenger updated successfully', passenger: passenger.toObject({ getters: true }) });
    } catch (err) {
        console.log(err);
        return next(new HttpError('Updating passenger failed, please try again later.', 500));
    }
};


// Delete passenger by ID
exports.deletePassenger = async (req, res, next) => {
    const passengerId = req.params.pid;

    try {
        const passenger = await Passenger.findById(passengerId);
        if (!passenger) {
            return next(new HttpError('Passenger not found.', 404));
        }
        await passenger.deleteOne();
        res.status(200).json({ message: 'Passenger deleted successfully' });
    } catch (err) {
        console.log(err);
        return next(new HttpError('Deleting passenger failed, please try again later.', 500));
    }
};