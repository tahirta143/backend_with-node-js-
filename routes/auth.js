const express = require("express");
const passport = require("passport");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protectUser } = require("../middleware/authMiddleware");

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `/login?error=auth_failed`,
    session: false,
  }),
  (req, res) => {
    // Successful authentication
    const token = req.user.generateAuthToken();
    
    // Redirect to frontend with token
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendURL}/auth/success?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}`);
  }
);

// Local Authentication Routes
router.post("/register", register);
router.post("/login", login);
router.get("/me", protectUser, getMe);

module.exports = router;