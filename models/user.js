const express = require('express');
const mongoose = require ('mongoose');
const bcrypt = require('bcrypt');


const userSchema = new mongoose.Schema({

    name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    

  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  phone: {
    type: String,
    required: true,
  },

  studentId: {
    type: String,
    required: true,
    unique: true,
    length: 8,
  },
  role: {
    type: String,
    enum: ['student', 'organizer'],
    default: null,
  },
  avatar: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },



});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);