import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import path, { dirname } from "path";
import { registerValidation, loginValidation } from "./validations.js";
import handleValidationErrors from "./utils/handleValidationErrors.js";
import checkAuth from "./utils/checkAuth.js";
import * as userController from "./controllers/userControllers.js";
import * as postController from "./controllers/postControllers.js";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import { fileURLToPath } from "url";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import User from "./models/User.js";
import session from "express-session";
import bcrypt from "bcrypt";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const avatarsPath = path.join(__dirname, "uploads");
app.use("/uploads", express.static(avatarsPath));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({}));
app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

async function generateSecurePassword() {
  const length = 8;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset.charAt(randomIndex);
  }
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  return hash;
}

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (id, done) => {
  try {
    const decodedToken = jwt.verify(id, process.env.JWT_KEY);
    const userId = decodedToken._id;
    const user = await User.findById(userId);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://catopia-backend.herokuapp.com/auth/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google Profile:", profile);
      try {
        const email =
          profile.emails && profile.emails.length > 0
            ? profile.emails[0].value
            : "test@test.com";

        if (!email) {
          return done(new Error("Email not found in the Google profile"), null);
        }

        let user = await User.findOne({ email: email });

        if (user) {
          const token = jwt.sign(
            {
              _id: user._id,
            },
            process.env.JWT_KEY,
            {
              expiresIn: "30d",
            }
          );
          console.log("User found:", user);
          console.log("Token:", token);
          return done(null, token);
        } else {
          // Создайте нового пользователя
          const password = await generateSecurePassword();
          const newUser = new User({
            name: profile.displayName,
            email: email,
            password: password,
            googleId: profile.id,
          });

          await newUser.save();
          const token = jwt.sign(
            {
              _id: newUser._id,
            },
            process.env.JWT_KEY,
            {
              expiresIn: "30d",
            }
          );
          console.log("Token:", token);
          return done(null, token);
        }
      } catch (err) {
        console.error("Error during GoogleStrategy:", err);
        done(null, err);
      }
    }
  )
);

mongoose
  .connect(process.env.MONGO_DB)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log(err);
    console.log("MongoDB not connected");
  });

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
  console.log("Hello World!");
  res.send("Hello World!");
});
// Пост запросы
app.post(
  "/login",
  loginValidation,
  handleValidationErrors,
  userController.login
);
app.post(
  "/register",
  registerValidation,
  handleValidationErrors,
  passport.authenticate("google", { scope: ["profile"] })
);
app.post("/auth/me", checkAuth, userController.getMe);
app.post("/profile/upload", checkAuth, userController.uploadAvatar);
app.post("/forgot-password", userController.sendConfirm);
app.post("/confirm", userController.verifyCode);
app.post("/post/create", checkAuth, postController.createPost);

// Патч запросы
app.patch("/change-password", userController.changePassword);

// Делит запросы
app.delete("/profile/delete", checkAuth, userController.deleteAvatar);
app.delete("/post/:postId/delete", checkAuth, postController.deletePost);

// Гет запросы
app.get("/posts", postController.getPosts);
app.get("/getAvatar", checkAuth, userController.getAvatar);
app.get("/getUser", checkAuth, userController.getUser);
app.get("/getAllUsers", userController.getAllUsers);
app.get("/getUser/:id", userController.getUserProfile);

// Пасспорт
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/callback",
  passport.authenticate("google", {
    failureRedirect: "http://catopia.onrender.com/login",
  }),
  (req, res) => {
    const authToken = req.user;
    res.redirect(
      `http://catopia.onrender.com/redirect-after-auth?authToken=${authToken}`
    );
  }
);
