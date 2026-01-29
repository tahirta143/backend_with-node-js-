const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// Serialize user to session
passport.serializeUser((user, done) => {
  done(null, user.id);
});
console.log("🔥🔥 PASSPORT CONFIG LOADED 🔥🔥");

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    // Check both User and Admin models
    let user = await User.findById(id);
    if (!user) {
      const Admin = require("../models/Admin");
      user = await Admin.findById(id);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if user exists with email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Update existing user with googleId
            user.googleId = profile.id;
            user.avatar = profile.photos[0].value;
            user.provider = "google";
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0].value,
              provider: "google",
              isVerified: true,
            });
          }
        }

        done(null, user);
      } catch (err) {
        console.error("Google OAuth Error:", err);
        done(err, null);
      }
    }
  )
);

module.exports = passport;