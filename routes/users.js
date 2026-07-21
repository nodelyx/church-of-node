const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update user profile
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.params.id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { avatar, bio } = req.body;

    let user = await User.findById(req.params.id);

    if (avatar) user.avatar = avatar;
    if (bio) user.bio = bio;

    await user.save();

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
