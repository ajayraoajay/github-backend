const axios = require("axios");
const db = require("../config/db");

// Save GitHub user data
exports.getUserData = async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).send("Username is required");

    const query = "SELECT * FROM users WHERE username = ?";
    db.query(query, [username], async (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length > 0) return res.status(200).send("User already exists");

        try {
            const { data } = await axios.get(`https://api.github.com/users/${username}`);
            const insertQuery = `INSERT INTO users (username, location, blog, bio, public_repos, public_gists, followers, following, avatar_url, created_at)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                data.login,
                data.location || null,
                data.blog || null,
                data.bio || null,
                data.public_repos,
                data.public_gists,
                data.followers,
                data.following,
                data.avatar_url,
                new Date(data.created_at).toISOString().slice(0, 19).replace("T", " "),
            ];
            db.query(insertQuery, values, (err) => {
                if (err) return res.status(500).send(err);
                res.status(201).send("User saved successfully");
            });
        } catch (error) {
            res.status(500).send("Error fetching data from GitHub");
        }
    });
};


// Update user details
exports.updateUser = (req, res) => {
    const { username } = req.params;
    const { location, blog, bio } = req.body;

    const query = `UPDATE users SET location = ?, blog = ?, bio = ? WHERE username = ? AND soft_deleted = FALSE`;
    db.query(query, [location, blog, bio, username], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send("User updated successfully");
    });
};

// Soft delete a user
exports.deleteUser = (req, res) => {
    const { username } = req.params;
    const query = `UPDATE users SET soft_deleted = TRUE WHERE username = ?`;

    db.query(query, [username], (err) => {
        if (err) return res.status(500).send(err);
        res.send("User soft deleted successfully");
    });
};

// Get all users
exports.getAllUsers = (req, res) => {
    const { sortBy } = req.query;
    const query = `SELECT * FROM users WHERE soft_deleted = FALSE ORDER BY ${sortBy || "id"}`;

    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
};

// Find mutual followers (friends)
exports.findFriends = (req, res) => {
    const { username } = req.params;

    const query = `SELECT u.username FROM users u
                   WHERE u.followers > 0 AND u.following > 0
                   AND u.username != ?
                   AND EXISTS (
                       SELECT 1 FROM users u2 WHERE u2.username = ? AND u2.following > 0
                   )`;

    db.query(query, [username, username], (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
};
