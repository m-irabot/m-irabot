const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

// Create the Express app
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Configure multer for file uploads
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Add your MySQL root password
  database: 'portfolio'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
  console.log('Connected to the MySQL database.');
});

// Routes

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'public.html'));
});

// Create a new post
app.post('/posts', upload.single('media'), (req, res) => {
  const { content } = req.body;
  const media = req.file ? req.file.filename : null;

  const sql = 'INSERT INTO posts (content, media) VALUES (?, ?)';
  db.query(sql, [content, media], (err, result) => {
    if (err) {
      console.error('Error creating post:', err);
      return res.status(500).json({ error: 'Failed to create post.' });
    }
    res.status(201).json({ message: 'Post created successfully!' });
  });
});

// Get all posts with comments, likes, and replies
app.get('/posts', (req, res) => {
  const sql = `
    SELECT p.id AS post_id, p.content, p.media, 
           COUNT(l.id) AS likes, 
           JSON_ARRAYAGG(JSON_OBJECT(
             'id', c.id, 
             'content', c.content, 
             'parent_comment_id', c.parent_comment_id
           )) AS comments
    FROM posts p
    LEFT JOIN likes l ON l.post_id = p.id
    LEFT JOIN comments c ON c.post_id = p.id
    GROUP BY p.id
    ORDER BY p.id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching posts:', err);
      return res.status(500).json({ error: 'Failed to fetch posts.' });
    }
    res.json(results);
  });
});

// Like a post
app.post('/posts/:postId/like', (req, res) => {
  const { postId } = req.params;

  const sql = 'INSERT INTO likes (post_id) VALUES (?)';
  db.query(sql, [postId], (err, result) => {
    if (err) {
      console.error('Error liking post:', err);
      return res.status(500).json({ error: 'Failed to like post.' });
    }
    res.json({ message: 'Post liked successfully!' });
  });
});

// Add a comment or reply
app.post('/posts/:postId/comments', (req, res) => {
  const { postId } = req.params;
  const { content, parentCommentId } = req.body;

  const sql = 'INSERT INTO comments (post_id, content, parent_comment_id) VALUES (?, ?, ?)';
  db.query(sql, [postId, content, parentCommentId || null], (err, result) => {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).json({ error: 'Failed to add comment.' });
    }
    res.status(201).json({ message: 'Comment added successfully!' });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
