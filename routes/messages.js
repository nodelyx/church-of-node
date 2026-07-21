const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all messages
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user.isDisciple) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const messages = await Message.find()
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json(messages.reverse());
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user.isDisciple) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const message = new Message({
      author: req.user.userId,
      content,
    });

    await message.save();
    await message.populate('author', 'username avatar');
    
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
