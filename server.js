const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

// Set up the app and middleware
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Set up MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Replace with your database password
  database: 'portfolio',
});

// Set up multer for file upload (for media)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to avoid file name conflicts
  },
});
const upload = multer({ storage });

// Handle contact form submission
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  
  // Insert the contact message into the database (optional)
  const sql = 'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)';
  db.query(sql, [name, email, message], (err) => {
    if (err) {
      console.error('Error saving contact message:', err);
      return res.status(500).json({ error: 'Failed to send message' });
    }
    res.status(200).json({ message: 'Message sent successfully' });
  });
});

// Handle post submission (with optional media file)
app.post('/posts', upload.single('media'), (req, res) => {
  const { content } = req.body;
  const media = req.file ? req.file.filename : null;

  // Insert the post into the database (with content and optional media)
  const sql = 'INSERT INTO posts (content, media) VALUES (?, ?)';
  db.query(sql, [content, media], (err) => {
    if (err) {
      console.error('Error creating post:', err);
      return res.status(500).json({ error: 'Failed to create post' });
    }
    res.status(201).json({ message: 'Post created successfully' });
  });
});

// Serve static files (like the portfolio pages)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/post', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'post.html'));
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
