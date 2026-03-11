const User = require('../models/user');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

// helper to generate token
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};


// registration handler moved from routes
const register = async (req, res) => {
  try {
    // validate request body with Joi
    const schema = Joi.object({
      name: Joi.string().trim().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required(),
      studentId: Joi.string().length(8).required(),
      password: Joi.string().min(6).required(),
      confirmPassword: Joi.ref('password')
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { name, email, phone, studentId, password } = value;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { studentId }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: existingUser.email === email ? 'Email already registered' : 'Student ID already registered' 
      });
    }

    // Create new user with default student role
    const user = new User({
      name,
      email,
      phone,
      studentId,
      password,
      role: 'student'
    });

    await user.save();

    // Return user without password plus a token
    const userResponse = user.toObject();
    delete userResponse.password;
    const token = createToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// login handler moved from routes
const login = async (req, res) => {
  try {
    // validate login input
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { email, password } = value;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check password
    const isPasswordCorrect = await user.matchPassword(password);
    
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Return user without password and a fresh token
    const userResponse = user.toObject();
    delete userResponse.password;
    const token = createToken(user);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// update role handler
const updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'organizer'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.role = role;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    const token = createToken(user);

    res.status(200).json({ success: true, user: userResponse, token });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ success: false, message: 'Server error updating role' });
  }
};

module.exports = { register, login, updateRole };