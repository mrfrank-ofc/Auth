const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({ username, password });
    await user.save();

    // Automatically log in the user after signup
    req.session.userId = user._id;
    res.json({ msg: 'User registered and logged in', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Set the user ID in the session
    req.session.userId = user._id;
    res.json({ msg: 'Logged in successfully', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Logout Route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ msg: 'Could not log out, please try again' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ msg: 'Logged out successfully' });
  });
});

// Protected Route Example
router.get('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  // Fetch user details from the database
  User.findById(req.session.userId)
    .then((user) => {
      res.json({ user });
    })
    .catch((err) => {
      console.error(err.message);
      res.status(500).send('Server error');
    });
});

module.exports = router;
