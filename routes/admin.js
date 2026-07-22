const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all users (for admin approval)
router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get current user's disciple status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json({
      isDisciple: user.isDisciple,
      isAdmin: user.isAdmin,
      username: user.username,
      email: user.email
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Approve user as disciple
router.post('/:userId/approve', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isDisciple: true },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Revoke disciple status
router.post('/:userId/revoke', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    
    if (!currentUser.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isDisciple: false },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
