const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const jwtSecret = 'your_jwt_secret';

// Middleware to verify token and get user id
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.userId = user.userId;
    next();
  });
}

// Get all tasks for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY id DESC', [req.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new task
router.post('/', authenticateToken, async (req, res) => {
  const { title } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tasks (user_id, title, completed) VALUES ($1, $2, $3) RETURNING *',
      [req.userId, title, false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [title, completed, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
