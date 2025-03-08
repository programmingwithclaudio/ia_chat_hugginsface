// server/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log("Verificando autenticación...");

    // Verificar si ya está autenticado por sesión (Google OAuth)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      console.log("Autenticado por sesión:", req.user);
      return next();
    }

    // Si no hay sesión, verificar JWT
    const token = req.cookies.auth_token;

    if (!token) {
      console.log("No se encontró token JWT en las cookies");
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    // Verificar token JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    ) as { userId: string };

    console.log("Token JWT decodificado:", decoded);

    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.userId);

    if (!user) {
      console.log("Usuario no encontrado en la base de datos");
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    console.log("Usuario autenticado:", user);

    // Adjuntar usuario a la solicitud
    req.user = user;
    next();
  } catch (error) {
    console.error("Error de autenticación:", error);
    res.status(401).json({ error: "No autenticado" });
  }
};