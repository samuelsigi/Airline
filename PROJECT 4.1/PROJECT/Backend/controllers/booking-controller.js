const Booking = require('../model/Booking');
const User = require('../model/User');
const Passenger = require('../model/Passengers');
const Flight = require('../model/Flight');
const seatClass = require('../model/SeatClass');
const HttpError = require('../model/http-error');
const mongoose = require('mongoose');

const checkFlightAvailability = (recurrenceType, selectedDate) => {
    const dayOfWeek = selectedDate.toLocaleString('en-US', { weekday: 'long' }); // Get the day of the week

    switch (recurrenceType) {
        case 'Daily':
            return true; // Flights are available every day

        case 'Weekends':
            return dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday'; // Flights are available only on weekends

        case 'Weekly:All':
            return dayOfWeek !== 'Saturday' && dayOfWeek !== 'Sunday'; // Flights available Monday to Friday

        default:
            if (recurrenceType.startsWith('Weekly:')) {
                const specificDay = recurrenceType.split(':')[1]; // Extract the specific day
                return dayOfWeek === specificDay; // Check if the selected day matches the specified day
            }
            return false; // Invalid recurrence type
    }
};

const createBooking = async (req, res, next) => {
    const { flight, userId, passenger, specificDate } = req.body;
    let totalPrice = 0;

    // Debugging log to check incoming request body
    console.log('Request Body:', req.body);

    try {
        // Ensure userId is present
        if (!userId) {
            return next(new HttpError('User ID is required.', 400));
        }

        // Find flight details
        const flightDetails = await Flight.findById(flight);
        if (!flightDetails) {
            return next(new HttpError('Flight not found.', 404));
        }

        // Convert specificDate to Date object
        const selectedDate = new Date(specificDate);

        // Check flight availability for the specific date
        const isAvailable = checkFlightAvailability(flightDetails.recurrence, selectedDate);
        if (!isAvailable) {
            return next(new HttpError('Flight cannot be booked on this date.', 400));
        }

        // Getting Corresponding Seat Details
        const seatClassDetails = await seatClass.findById(flightDetails.seatModel._id);

        // Find all passengers
        const allPassengers = await Passenger.find({ _id: { $in: passenger } });
        if (!Array.isArray(allPassengers) || allPassengers.length === 0) {
            const foundPassengerIds = allPassengers.map(p => p._id.toString());
            const missingPassengerIds = passenger.filter(id => !foundPassengerIds.includes(id));

            return next(new HttpError(`Passenger IDs not found: ${missingPassengerIds.join(', ')}`, 404));
        }

        // Calculate total price for each passenger
        allPassengers.forEach((passenger) => {
            let seatPrice = 0;
            let foodPrice = 0;
            let discount = 0;

            // Determine seat price and food price based on seat class and food choice
            switch (passenger.seatClass) {
                case 'Economy':
                    seatPrice = seatClassDetails.economySeatPrice;
                    foodPrice = passenger.food === 'Yes' ? seatClassDetails.economyFoodPrice : 0;
                    if (['Student', 'Senior Citizen', 'Disabled', 'Army', 'Doctor'].includes(passenger.type)) {
                        discount = Math.min(seatPrice * 0.1, 600);
                    }
                    break;
                case 'Business':
                    seatPrice = seatClassDetails.businessSeatPrice;
                    foodPrice = passenger.food === 'Yes' ? seatClassDetails.businessFoodPrice : 0;
                    break;
                case 'First':
                    seatPrice = seatClassDetails.firstClassSeatPrice;
                    foodPrice = passenger.food === 'Yes' ? seatClassDetails.firstClassFoodPrice : 0;
                    break;
                default:
                    return next(new HttpError('Invalid seat class.', 400));
            }

            // Check if seatPrice and foodPrice are valid numbers
            if (isNaN(seatPrice) || isNaN(foodPrice)) {
                return next(new HttpError('Invalid price values found for seat or food.', 500));
            }

            // Add seat and food price to total where 15% tax
            totalPrice += ((seatPrice + foodPrice) * 1.15) - discount;
        });

        const passengerIds = allPassengers.map(p => p._id.toString()); // Convert ObjectId to string

        // Start a transaction session
        const sess = await mongoose.startSession();
        sess.startTransaction();

        // Create new booking
        const newBooking = new Booking({
            user: userId,  // Ensure this is correctly set
            flight,
            passenger: passengerIds,
            totalPrice,
            specificDate: selectedDate, // Set specificDate to the date provided in the request
            bookingDate: new Date() // Set booking date to current date
        });

        // Attempt to save booking
        try {
            const savedBooking = await newBooking.save({ session: sess });
            console.log('Saved Booking:', savedBooking); // Log the saved booking
        } catch (err) {
            console.error('Error saving booking:', err); // Log any errors
            await sess.abortTransaction();
            sess.endSession();
            return next(new HttpError('Booking save failed.', 500));
        }

        // Update user's bookings
        const user = await User.findById(userId);
        if (!user) {
            await sess.abortTransaction();
            sess.endSession();
            return next(new HttpError('User not found.', 404));
        }

        user.bookings.push(newBooking._id);
        await user.save({ session: sess });

        // Commit transaction
        await sess.commitTransaction();
        sess.endSession();

        // Return the new booking as JSON
        res.status(201).json({ booking: newBooking });

    } catch (err) {
        console.log(err);
        console.error('Error in createBooking:', err); // Detailed error logging
        return next(new HttpError('Creating booking failed, please try again.', 500));
        
    }
};







// Delete a booking
const deleteBooking = async (req, res, next) => {
    const bookingId = req.params.bid;

    let booking;
    let attempts = 0;
    const maxAttempts = 3; // Set a limit for the number of retries

    while (attempts < maxAttempts) {
        attempts++;
        const sess = await mongoose.startSession();
        sess.startTransaction();

        try {
            booking = await Booking.findById(bookingId).populate('user'); // Populate the user to access their bookings
            if (!booking) {
                await sess.abortTransaction(); // Abort if booking not found
                return next(new HttpError('Booking not found.', 404));
            }

            // Remove the booking from the user's bookings array
            booking.user.bookings = booking.user.bookings.filter(b => b.toString() !== bookingId.toString());
            await booking.user.save({ session: sess });

            // Delete the booking
            await Booking.findByIdAndDelete(bookingId, { session: sess });

            // Commit the transaction
            await sess.commitTransaction();

            res.status(200).json({ message: 'Booking successfully deleted.' });
            return; // Exit after successful deletion

        } catch (err) {
            await sess.abortTransaction(); // Abort the transaction on error
            if (err.code === 112) { // Check for write conflict error
                console.log(`Write conflict detected. Retrying (${attempts}/${maxAttempts})...`);
                continue; // Retry the operation
            } else {
                console.log(err);
                return next(new HttpError('Deleting booking failed, please try again.', 500));
            }
        } finally {
            sess.endSession(); // End the session
        }
    }

    return next(new HttpError('Deleting booking failed after multiple attempts.', 500));
};


// Get booking by ID
const getBookingById = async (req, res, next) => {
    const bookingId = req.params.bid;

    let booking;
    try {
        booking = await Booking.findById(bookingId).populate('passenger');
        if (!booking) {
            return next(new HttpError('Booking not found.', 404));
        }
        res.status(200).json({ booking });
    } catch (err) {
        const error = new HttpError('Fetching booking failed, please try again.', 500);
        return next(error);
    }
};

// Get all bookings for a user
const getAllBookings = async (req, res, next) => {
    let bookings;
    try {
        bookings = await Booking.find();

        if (!bookings || bookings.length === 0) {
            return next(new HttpError('No Bookings found.', 404));
        }

        res.status(200).json({ bookings });
    } catch (err) {
        const error = new HttpError('Fetching bookings failed, please try again.', 500);
        return next(error);
    }
};

module.exports = {
    createBooking,
    deleteBooking,
    getBookingById,
    getAllBookings
};
