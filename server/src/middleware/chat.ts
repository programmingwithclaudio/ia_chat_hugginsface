// server/middleware/chat.ts
import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import Chat from "../models/chat.model.js";

/**
 * Validate if the chat ID is in the correct format
 */
export const validateChatId = async (
  req: Request,
  res: Response,
  next: NextFunction,
  chatId: string
): Promise<void> => {
  console.log("Validando chatId:", chatId);

  // Expresión regular para validar UUID v4
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

  if (!uuidRegex.test(chatId)) {
    res.status(400).json({ error: "ID de chat inválido" });
    return;
  }

  next();
};

/**
 * Check if the chat exists
 */
export const validateChatExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const chatId = req.params.chatId;

    // Buscar el chat por UUID
    const chat = await Chat.findOne({ uuid: chatId });

    if (!chat) {
      return res.status(404).json({ error: "Conversación no encontrada" });
    }

    // Adjuntar chat al objeto `req`
    req.chat = chat;
    next();
  } catch (error) {
    console.error("Error validating chat:", error);
    res.status(500).json({ error: "Error al validar la conversación" });
  }
};

/**
 * Verify that the user has access to the chat
 */
export const hasAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
  chatId: string
): Promise<void> => {
  console.log("Verificando acceso al chat:", chatId);

  const startTime = Date.now();

  try {
    const chat = await Chat.findOne({ uuid: chatId, userId: req.user.id });

    const endTime = Date.now();
    console.log(`Tiempo de consulta: ${endTime - startTime} ms`);

    if (!chat) {
      res.status(403).json({ error: "No tienes acceso a este chat" });
      return;
    }

    next();
  } catch (error) {
    console.error("Error verificando acceso al chat:", error);
    res.status(500).json({ error: "Error al verificar acceso al chat" });
  }
};
