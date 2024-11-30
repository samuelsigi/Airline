const Role = require('../model/Role');
const User = require('../model/User')
const HttpError = require('../model/http-error');

// Create a new role
exports.createRole = async (req, res, next) => {
  const { role } = req.body;

  if (!role) {
    return next(new HttpError('Role name is required.', 422));
  }

  try {
    // Check if role already exists
    const existingRole = await Role.findOne({ role });
    if (existingRole) {
      return next(new HttpError('Role already exists.', 422));
    }

    // Create new role
    const createdRole = new Role({ role });
    await createdRole.save();

    res.status(201).json({ role: createdRole.toObject({ getters: true }) });
  } catch (err) {
    return next(new HttpError('Creating role failed, please try again.', 500));
  }
};

// form-data is not taking but not a problem


// Get a role by ID
exports.getRoleById = async (req, res, next) => {
  const roleId = req.params.rid;

  try {
    const role = await Role.findById(roleId);
    if (!role) {
      return next(new HttpError('Role not found.', 404));
    }
    res.json({ role: role.toObject({ getters: true }) });
  } catch (err) {
    return next(new HttpError('Fetching role failed, please try again later.', 500));
  }
};

// Get all roles
exports.getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find();
    if (!roles || roles.length === 0) {
      return next(new HttpError('No roles found.', 404));
    }

    res.status(200).json({
      roles: roles.map(role => role.toObject({ getters: true }))
    });
  } catch (err) {
    return next(new HttpError('Fetching roles failed, please try again later.', 500));
  }
};



// Update a role by ID
exports.updateRole = async (req, res, next) => {
    const roleId = req.params.rid;
    const { role } = req.body;
  
    if (!role) {
      return next(new HttpError('Role name is required.', 422));
    }
  
    try {
      const existingRole = await Role.findById(roleId);
      if (!existingRole) {
        return next(new HttpError('Role not found.', 404));
      }
  
      // Update the role name
      existingRole.role = role;
      await existingRole.save();
  
      res.status(200).json({ role: existingRole.toObject({ getters: true }) });
    } catch (err) {
      console.log(err);
      return next(new HttpError('Updating role failed, please try again later.', 500));
    }
  };

// Delete a role by ID
exports.deleteRole = async (req, res, next) => {
  const roleId = req.params.rid;

  try {
    const role = await Role.findById(roleId);
    if (!role) {
      return next(new HttpError('Role not found.', 404));
    }

    // Check if any user is using this role
    const usersWithRole = await User.find({ isRole: roleId });
    if (usersWithRole.length > 0) {
      return next(new HttpError('Cannot delete role because there are users assigned to it.', 400));
    }

    // Delete the role
    await role.deleteOne();

    res.status(200).json({ message: 'Role deleted successfully.' });
  } catch (err) {
    return next(new HttpError('Deleting role failed, please try again later.', 500));
  }
};
