const express = require("express");
const {
    getUserData,
    updateUser,
    deleteUser,
    getAllUsers,
    findFriends,
    getFriends,
    searchUsers,
    
} = require("../controllers/userController");



const router = express.Router();

// Define API routes
router.post("/", getUserData); // Save GitHub user data
router.put("/:username", updateUser); // Update user details
router.delete("/:username", deleteUser); // Soft delete a user
router.get("/", getAllUsers);// Get all users
router.get("/friends/:username", findFriends); // Find mutual followers
router.get("/:username/friends", getFriends); //Get friends
router.get("/search", searchUsers); // To search users

//API Validation
const { body, param, query, validationResult } = require("express-validator");
const { validateRequest } = require("../middlewares/validateRequest");
router.post(
    "/",
    body("username").isString().notEmpty().withMessage("Username is required"),
    validateRequest,
    getUserData
);

router.get(
    "/search",
    [
        query("username").optional().isString(),
        query("location").optional().isString(),
    ],
    validateRequest,
    searchUsers
);





module.exports = router;
