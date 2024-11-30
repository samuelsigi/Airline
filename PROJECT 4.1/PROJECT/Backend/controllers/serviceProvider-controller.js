const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const ServiceProvider = require('../model/Service-Provider');
const Role = require('../model/Role');
const HttpError = require('../model/http-error');

// Register a new Service Provider
exports.signupServiceProvider = async (req, res, next) => {
    const { name, email, password, phone, isRole } = req.body;

    const logo = req.file ? req.file.path : null;
  
    if (!logo) {
      return next(new HttpError('No logo provided.', 422));
    }
  
    try {
      // Check if Service Provider already exists
      const existingServiceProvider = await ServiceProvider.findOne({ email });
      if (existingServiceProvider) {
        return next(new HttpError('Service Provider already exists, please check again.', 422));
      }
  
      // Hash password
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(password, 12);
      } catch (err) {
        return next(new HttpError('Password hashing failed, could not create Service Provider', 500));
      }
  
      // Normalize the image paths
      const imagePath = req.file.path.replace(/\\/g, '/');
  
      // Retrieve the role document based on the role name
      const serviceProviderRole = await Role.findOne({ role: isRole });
      if (!serviceProviderRole) {
        return next(new HttpError('Role not found, please provide a valid role.', 422));
      }
  
      // Create new Service Provider
      const createdServiceProvider = new ServiceProvider({
        name,
        phone,
        email,
        password: hashedPassword,
        isRole: serviceProviderRole._id,
        logo: `http://localhost:4000/${imagePath}`,
        seatClass: [],
        flights: []
      });
  
      await createdServiceProvider.save();
  
      res.status(201).json({ serviceProvider: createdServiceProvider.toObject({ getters: true }) });
    } catch (err) {
      console.error(err);
      return next(new HttpError('Signup failed, please try again.', 500));
    }
  };
  
  

// Login
exports.loginServiceProvider = async (req, res, next) => {
  const { email, password } = req.body;

  console.log(req.body); // Check the request body

  try {
    // Check if exists
    const existingServiceProvider = await ServiceProvider.findOne({ email }).populate('isRole');
    if (!existingServiceProvider) {
      return next(new HttpError('Invalid credentials, could not log you in.', 401));
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, existingServiceProvider.password);
    if (!isValidPassword) {
      return next(new HttpError('Invalid credentials, could not log you in.', 401));
    }

    // Update lastLogin to current date and time
    existingServiceProvider.lastLogin = Date.now(); // Update lastLogin field
    await existingServiceProvider.save(); // Save the updated Service Provider document

    res.status(200).json({
      message: 'Logged In Successfully',
      serviceProvider: existingServiceProvider.toObject({ getters: true })
    });
  } catch (err) {
    console.log(err);
    return next(new HttpError('Logging in failed, please try again.', 500));
  }
};



// Get Service Provider details by ID
exports.getServiceProvider = async (req, res, next) => {
  const spid = req.params.spid;

  try {
    const serviceProvider = await ServiceProvider.findById(spid).populate('seatClass').populate('flights').populate('isRole','role');
    if (!serviceProvider) {
      return next(new HttpError('Service Provider not found.', 404));
    }
    res.json({ serviceProvider: serviceProvider.toObject({ getters: true }) });
  } catch (err) {
    console.log(err)
    return next(new HttpError('Fetching Service Providers failed, please try again later.', 500));
  }
};

// Get all ServiceProvider
exports.getAllServiceProvider = async (req, res, next) => {
  try {
    const serviceProviders = await ServiceProvider.find({}, '-password').populate('isRole','role')
    .populate('seatClass', 'seatClassName') // Replace seatClass ID with name
    .populate('flights', 'flightNumber'); // Exclude password field for security

    if (!serviceProviders || serviceProviders.length === 0) {
      return next(new HttpError('No Service Provider found.', 404));
    }

    res.status(200).json({
        serviceProviders: serviceProviders.map(serviceProvider => serviceProvider.toObject({ getters: true }))
    });
  } catch (err) {
    return next(new HttpError('Fetching Service Providers failed, please try again later.', 500));
  }
};




// Update ServiceProvider details
exports.updateServiceProvider = async (req, res, next) => {
  const spid = req.params.spid;
  const { name, phone } = req.body;

  console.log(req.body) // returns null in form data

  try {
    const serviceProvider = await ServiceProvider.findById(spid);
    if (!serviceProvider) {
      return next(new HttpError('Service Provider not found.', 404));
    }

    serviceProvider.name = name || serviceProvider.name;
    serviceProvider.phone = phone || serviceProvider.phone;
    await serviceProvider.save();

    res.status(200).json({ serviceProvider: serviceProvider.toObject({ getters: true }) });
  } catch (err) {
    return next(new HttpError('Updating Service Provider failed, please try again later.', 500));
  }
};


// Delete ServiceProvider details
exports.deleteServiceProvider = async (req, res, next) => {
  const spid = req.params.spid;

  try {
    const serviceProvider = await ServiceProvider.findById(spid).populate('seatClass').populate('flights');
    if (!serviceProvider) {
      return next(new HttpError('Service Provider not found.', 404));
    }

    if (serviceProvider.flights.length > 0) {
      return next(new HttpError('Cannot delete Service Provider with active flights.', 422));
    }

    // Delete the Service Provider logo from the filesystem
    if (serviceProvider.logo) {
    // Extract the relative path from the URL
    const imagePath = serviceProvider.logo.replace(/^http:\/\/localhost:4000/, ''); // This gets the relative path

    // Construct the absolute path
    const absolutePath = path.join('images', '..', imagePath); 

    fs.unlink(absolutePath, (err) => {
        if (err) {
        console.error('Failed to delete image:', err);
        }
    });
    }

    await serviceProvider.deleteOne();

    res.status(200).json({ message: 'Service Provider deleted successfully.' });
  } catch (err) {
    return next(new HttpError('Deleting Service Provider failed, please try again later.', 500));
  }
};