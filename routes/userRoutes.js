const express = require("express");
const {
    getUserData,
    updateUser,
    deleteUser,
    getAllUsers,
    findFriends,
} = require("../controllers/userController");

const router = express.Router();

// Define API routes
router.post("/", getUserData); // Save GitHub user data
router.put("/:username", updateUser); // Update user details
router.delete("/:username", deleteUser); // Soft delete a user
router.get("/", getAllUsers); // Get all users
router.get("/friends/:username", findFriends); // Find mutual followers

module.exports = router;
