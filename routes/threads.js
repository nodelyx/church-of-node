const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread');
const User = require('../models/User');
const Reply = require('../models/Reply');
const auth = require('../middleware/auth');

// Get all threads
router.get('/', async (req, res) => {
  try {
    const threads = await Thread.find()
      .populate('author', 'username avatar')
      .populate('category', 'name color')
      .sort({ isPinned: -1, createdAt: -1 });

    res.json(threads);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get thread by ID
router.get('/:id', async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id)
      .populate('author', 'username avatar bio')
      .populate('category', 'name color')
      .populate('likes', 'username')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username avatar bio' }
      });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json(thread);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create thread
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const thread = new Thread({
      title,
      content,
      author: req.user.userId,
    });

    await thread.save();
    await thread.populate('author', 'username avatar');

    res.json(thread);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like thread
router.post('/:id/like', auth, async (req, res) => {
  try {
    let thread = await Thread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const userIndex = thread.likes.indexOf(req.user.userId);

    if (userIndex === -1) {
      thread.likes.push(req.user.userId);
    } else {
      thread.likes.splice(userIndex, 1);
    }

    await thread.save();
    res.json(thread);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Pin/Unpin thread (admin only)
router.post('/:id/pin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    let thread = await Thread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    thread.isPinned = !thread.isPinned;
    await thread.save();

    res.json(thread);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete thread (author or admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.id);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const user = await User.findById(req.user.userId);

    if (thread.author.toString() !== req.user.userId && !user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Reply.deleteMany({ thread: req.params.id });
    await Thread.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Thread removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
