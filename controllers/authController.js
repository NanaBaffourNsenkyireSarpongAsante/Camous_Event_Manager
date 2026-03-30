const crypto = require('crypto');
const User = require('../models/user');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/mailer');

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
      email: Joi.string().pattern(/^[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|icloud|live|me)\.(com|net|org)$/).required().messages({
        'string.pattern.base': 'Invalid email.',
        'string.empty': 'Invalid email.',
      }),
      phone: Joi.string().required(),
      studentId: Joi.string().length(8).required(),
      password: Joi.string().min(6).pattern(/(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/).required().messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter and one symbol.',
      }),
      confirmPassword: Joi.ref('password'),
      role: Joi.string().valid('student', 'organizer').required(),
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    const { name, email, phone, studentId, password, role } = value;

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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new user with default student role
    const user = new User({
      name,
      email,
      phone,
      studentId,
      password,
      role,
      verificationToken,
      verificationTokenExpiry,
    });

    await user.save();

    // Send verification email in the background — do not block the response
    const verifyUrl = `${process.env.CLIENT_URL}/api/auth/verify/${verificationToken}`;
    sendEmail({
      to: email,
      subject: 'Verify your University Events Manager account',
      html: `
        <h2>Welcome to University Events Manager, ${name}!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:6px;">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        <p>If you did not create an account, ignore this email.</p>
      `,
    }).catch(err => console.error('Verification email failed to send:', err));

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
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

    // Block unverified users
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.' });
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

// email verification handler
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/index.html?verified=false`);
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    return res.redirect(`${process.env.CLIENT_URL}/index.html?verified=true`);
  } catch (error) {
    console.error('Verify email error:', error);
    return res.redirect(`${process.env.CLIENT_URL}/index.html?verified=false`);
  }
};

// profile update handler — name, phone, avatar only (email + studentId are immutable)
const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty' });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name: name.trim(), phone, avatar: avatar || null },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

module.exports = { register, login, updateRole, verifyEmail, updateProfile };