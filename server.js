const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================= MySQL =================
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',            // เปลี่ยนตาม user ของคุณ
    password: 'cha24wee',    // เปลี่ยนตามรหัสของคุณ
    database: 'food_delivery'
});

db.connect(err => {
    if(err) throw err;
    console.log("✅ Connected to MySQL!");
});

// ================= USERS =================

// Signup
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(sql, [username, password], (err) => {
        if(err){
            if(err.code === 'ER_DUP_ENTRY') return res.status(400).send('Username exists');
            return res.status(500).send('Server error');
        }
        res.send('Signup success');
    });
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT id, username FROM users WHERE username=? AND password=?";
    db.query(sql, [username, password], (err, results) => {
        if(err) return res.status(500).send('Server error');
        if(results.length === 0) return res.status(401).send("Invalid username or password");
        res.json({ userId: results[0].id, username: results[0].username });
    });
});

// ลบ user
app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;

    const sql = "DELETE FROM users WHERE id = ?";
    db.query(sql, [userId], (err, result) => {
        if(err){
            console.error(err);
            return res.status(500).send("Database error: " + err.message);
        }
        if(result.affectedRows === 0){
            return res.status(404).send("User not found");
        }
        res.send("User deleted successfully");
    });
});



// ================= CART =================

// Add item to cart
app.post('/cart', (req, res) => {
    const { userId, food_name, price } = req.body;
    const sql = 'INSERT INTO cart_items (user_id, food_name, price) VALUES (?, ?, ?)';
    db.query(sql, [userId, food_name, price], (err) => {
        if(err) return res.status(500).send('Server error');
        res.send('Item added');
    });
});

// Get cart items for user
app.get('/cart/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = 'SELECT * FROM cart_items WHERE user_id=?';
    db.query(sql, [userId], (err, results) => {
        if(err) return res.status(500).send('Server error');
        res.json(results);
    });
});

// Delete item from cart
app.delete('/cart/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM cart_items WHERE id=?';
    db.query(sql, [id], (err, result) => {
        if(err) return res.status(500).send('Server error');
        if(result.affectedRows === 0) return res.status(404).send('Item not found');
        res.send('Item removed');
    });
});

// ================= START SERVER =================
app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));
