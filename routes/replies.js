const express = require('express');
const router = express.Router();
const Reply = require('../models/Reply');
const Thread = require('../models/Thread');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create reply
router.post('/', auth, async (req, res) => {
  try {
    const { content, threadId } = req.body;

    const thread = await Thread.findById(threadId);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const reply = new Reply({
      content,
      author: req.user.userId,
      thread: threadId,
    });

    await reply.save();
    await reply.populate('author', 'username avatar bio');

    thread.replies.push(reply._id);
    await thread.save();

    res.json(reply);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Like reply
router.post('/:id/like', auth, async (req, res) => {
  try {
    let reply = await Reply.findById(req.params.id);

    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    const userIndex = reply.likes.indexOf(req.user.userId);

    if (userIndex === -1) {
      reply.likes.push(req.user.userId);
    } else {
      reply.likes.splice(userIndex, 1);
    }

    await reply.save();
    res.json(reply);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete reply
router.delete('/:id', auth, async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id);

    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    const user = await User.findById(req.user.userId);

    if (reply.author.toString() !== req.user.userId && !user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Reply.findByIdAndRemove(req.params.id);

    // Remove reply from thread
    await Thread.findByIdAndUpdate(
      reply.thread,
      { $pull: { replies: req.params.id } }
    );

    res.json({ msg: 'Reply removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
