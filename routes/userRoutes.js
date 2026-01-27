const express = require("express");
const router = express.Router();
const { getProfile, updateProfile } = require("../controllers/userController");
const { protectUser } = require("../middleware/authMiddleware");

router.route("/profile")
  .get(protectUser, getProfile)
  .put(protectUser, updateProfile);

module.exports = router;