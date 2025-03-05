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
    // Verificar si ya está autenticado por sesión (Google OAuth)
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // Si no hay sesión, verificar JWT
    const token = req.cookies.auth_token;

    if (!token) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    // Verificar token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    ) as { userId: string };

    // Buscar usuario
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }

    // Adjuntar usuario a la solicitud
    req.user = user;
    next();
  } catch (error) {
    console.error("Error de autenticación:", error);
    res.status(401).json({ error: "No autenticado" });
  }
};
