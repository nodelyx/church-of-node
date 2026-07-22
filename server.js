const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/church-of-node', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
  createDefaultCategories();
  setupAdmin();
}).catch(err => {
  console.log('MongoDB connection error:', err);
});

// Create default categories if they don't exist
async function createDefaultCategories() {
  try {
    const Category = require('./models/Category');
    const count = await Category.countDocuments();
    
    if (count === 0) {
      const defaultCategories = [
        { name: 'General Discussion', description: 'General topics and discussion', color: '#ffffff' },
        { name: 'Node.js', description: 'Discuss Node.js and JavaScript', color: '#68a063' },
        { name: 'Web Development', description: 'Web development topics', color: '#f7df1e' },
        { name: 'Help & Support', description: 'Get help and support from the community', color: '#ff6b6b' },
      ];
      
      await Category.insertMany(defaultCategories);
      console.log('Default categories created');
    }
  } catch (err) {
    console.log('Error creating default categories:', err.message);
  }
}

// Setup admin user (first user with username 'nodelyx')
async function setupAdmin() {
  try {
    const User = require('./models/User');
    const user = await User.findOne({ username: 'nodelyx' });
    
    if (user && !user.isAdmin) {
      user.isAdmin = true;
      user.isDisciple = true;
      await user.save();
      console.log('Admin user set up successfully');
    }
  } catch (err) {
    console.log('Error setting up admin:', err.message);
  }
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/threads', require('./routes/threads'));
app.use('/api/replies', require('./routes/replies'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));

// Serve forum static files
app.use('/forum', express.static(path.join(__dirname, 'public', 'forum')));

// Serve main website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve forum
app.get('/forum', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forum', 'index.html'));
});

// Serve profile page
app.get('/me', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'me.html'));
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve disciples page
app.get('/disciples', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'disciples.html'));
});

// Serve node.html
app.get('/node', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'node.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
