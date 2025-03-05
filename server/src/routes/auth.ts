// server/routes/auth.ts
import express from "express";
import passport from "../config/passport.google.js";
import session from "express-session";
import {
  register,
  login,
  getCurrentUser,
  logout,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middleware/auth.js";
import jwt from "jsonwebtoken";
import { IUser } from "../models/user.model.js";

const router = express.Router();

// Inicializar Passport
router.use(passport.initialize());
router.use(passport.session());

// Rutas para autenticación con credenciales
router.post("/register", register);
router.post("/login", login);

// Rutas para autenticación con Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// server/routes/auth.ts
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Después de autenticación exitosa con Google, genera un JWT
    const token = jwt.sign(
      { userId: (req.user as IUser)._id },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "7d" }
    );

    // Configura la cookie para que el cliente la reciba
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      // Si es en desarrollo, podrías usar sameSite: "lax" en lugar de "none"
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      domain:
        process.env.NODE_ENV === "production" ? ".tudominio.com" : "localhost",
    });

    res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:3000"}/dashboard`
    );
  }
);

// Rutas comunes para ambos tipos de autenticación
router.get("/current-user", isAuthenticated, getCurrentUser);
router.get("/logout", logout);

export default router;
