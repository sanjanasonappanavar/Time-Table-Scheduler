// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Mongoose Model for User

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create a new User instance (password hashing happens in the model's pre-save hook)
    user = new User({
      email,
      password
    });

    await user.save();

    // Create and send back a JSON Web Token (JWT)
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Make sure JWT_SECRET is in your .env file!
      { expiresIn: '5 days' }, 
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error during signup');
  }
});

// @route   POST /api/auth/signin
// @desc    Authenticate user & get token
// @access  Public
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check for user existence
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Login failed. Check credentials.' });
    }

    // 2. Compare the provided password with the hashed password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Login failed. Check credentials.' });
    }

    // 3. Create and send back a JWT upon successful login
    const payload = {
      user: {
        id: user.id
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error during signin');
  }
});

module.exports = router;