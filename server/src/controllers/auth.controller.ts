// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model.js";

// Crear un nuevo usuario con credenciales
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      res.status(400).json({ error: "Todos los campos son requeridos" });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: "El usuario ya existe" });
      return;
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo usuario
    const newUser = await User.create({
      authProvider: "manual",
      email,
      password: hashedPassword,
      displayName,
      profilePicture:
        "https://ui-avatars.com/api/?name=" + encodeURIComponent(displayName),
      isPremium: false,
    });

    // Generar token JWT
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "7d" }
    );

    // Configurar cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // Responder sin incluir la contraseña
    const userResponse = {
      _id: newUser._id,
      email: newUser.email,
      displayName: newUser.displayName,
      profilePicture: newUser.profilePicture,
      isPremium: newUser.isPremium,
      authProvider: newUser.authProvider,
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Iniciar sesión con credenciales
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email y contraseña son requeridos" });
      return;
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ error: "Credenciales inválidas" });
      return;
    }

    // Verificar si es usuario de Google
    if (user.authProvider === "google" && !user.password) {
      res.status(400).json({
        error:
          "Esta cuenta usa autenticación con Google. Por favor, utiliza 'Iniciar sesión con Google'.",
      });
      return;
    }

    // Verificar contraseña
    if (!user.password) {
      res.status(400).json({ error: "Credenciales inválidas" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Credenciales inválidas" });
      return;
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "7d" }
    );

    // Configurar cookie
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // Responder sin incluir la contraseña
    const userResponse = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      isPremium: user.isPremium,
      authProvider: user.authProvider,
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Obtener usuario actual
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // El middleware de autenticación ya habrá adjuntado el usuario a req
    const user = req.user as IUser;
    if (!user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    const userResponse = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      isPremium: user.isPremium,
      authProvider: user.authProvider,
    };

    res.status(200).json(userResponse);
  } catch (error) {
    console.error("Error al obtener usuario actual:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// Cerrar sesión
export const logout = (req: Request, res: Response): void => {
  try {
    // Limpiar cookie JWT
    res.clearCookie("auth_token");

    // Si está usando sesión (para Google OAuth)
    if (req.logout) {
      req.logout((err) => {
        if (err) {
          console.error("Error en logout de sesión:", err);
        }

        if (req.session) {
          req.session.destroy((err) => {
            if (err) {
              console.error("Error al destruir sesión:", err);
            }
          });
        }
      });
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
