const passport       = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const JWTStrategy    = require("passport-jwt").Strategy;
const ExtractJWT     = require("passport-jwt").ExtractJwt;
const User           = require("../models/User");
const { sendWelcomeEmail } = require("../utils/email");

// ── JWT Strategy ──────────────────────────────────────────────
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey:    process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select("-password -refreshToken");
        if (!user) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// ── Google OAuth Strategy ─────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,
      scope:        ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email  = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        const name   = profile.displayName || "User";

        if (!email) return done(new Error("No email from Google"), false);

        // Find or create user
        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

        if (user) {
          // Update Google ID if logging in via Google for the first time
          if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.avatar) user.avatar = avatar;
            user.isEmailVerified = true;
            await user.save({ validateBeforeSave: false });
          }
        } else {
          // New user via Google
          user = await User.create({
            name,
            email,
            googleId:        profile.id,
            avatar,
            isEmailVerified: true,
            role:            "user",
          });

          // Send welcome email non-blocking
          sendWelcomeEmail(email, name).catch(console.error);
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Serialize / Deserialize for session
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password -refreshToken");
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
