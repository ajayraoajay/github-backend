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
            const insertQuery = `
                INSERT INTO users (username, location, blog, bio, public_repos, public_gists, followers, following, avatar_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                data.login,
                data.location || "", // Use empty string if location is null
                data.blog || "",     // Use empty string if blog is null
                data.bio || "",      // Use empty string if bio is null
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
    const validSortFields = [
        "public_repos",
        "public_gists",
        "followers",
        "following",
        "created_at",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "id";

    const query = `SELECT * FROM users WHERE soft_deleted = FALSE ORDER BY ${sortField}`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
};


// Find mutual followers (friends)

exports.findFriends = (req, res) => {
    const { username } = req.params;

    // Query to get mutual followers
    const findMutualFollowersQuery = `
        SELECT u.id AS user_id, u2.id AS friend_id
        FROM users u
        INNER JOIN users u2
        ON u.followers > 0 AND u.following > 0
           AND u2.following > 0
           AND u.username = ?
           AND u2.username != u.username
    `;

    db.query(findMutualFollowersQuery, [username], (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length === 0) {
            return res.status(404).send("No mutual friends found.");
        }

        // Insert mutual friends into the 'friends' table
        const insertQuery = `
            INSERT IGNORE INTO friends (user_id, friend_id)
            VALUES ?
        `;
        const values = results.map((row) => [row.user_id, row.friend_id]);

        db.query(insertQuery, [values], (err) => {
            if (err) return res.status(500).send(err);
            res.send("Mutual friends saved successfully.");
        });
    });
};

// Get friends
 exports.getFriends = (req, res) => {
    const { username } = req.params;

    const query = `
        SELECT u2.username AS friend
        FROM friends
        INNER JOIN users u ON friends.user_id = u.id
        INNER JOIN users u2 ON friends.friend_id = u2.id
        WHERE u.username = ?
    `;

    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
};
// Search users
exports.searchUsers = (req, res) => {
    const { username, location } = req.query;

    const query = `
        SELECT * FROM users
        WHERE soft_deleted = FALSE
          AND (username LIKE ? OR ? IS NULL)
          AND (location LIKE ? OR ? IS NULL)
    `;

    db.query(
        query,
        [`%${username}%`, username, `%${location}%`, location],
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.send(results);
        }
    );
};



