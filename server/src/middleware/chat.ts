// server/middleware/chat.ts
import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";
import Chat from "../models/chat.model.js";

/**
 * Validate if the chat ID is in the correct format
 */
export const validateChatId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const chatId = req.params.chatId;

  // If using UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(chatId)) {
    return res.status(400).json({ error: "ID de conversación inválido" });
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

    const chat = await Chat.findOne({ uuid: chatId });

    if (!chat) {
      return res.status(404).json({ error: "Conversación no encontrada" });
    }

    // Attach chat to request for later use
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
export const hasAccess = (req: Request, res: Response, next: NextFunction) => {
  // Check if chat belongs to the authenticated user
  if (req.chat.userId.toString() !== req.user.id.toString()) {
    return res
      .status(403)
      .json({ error: "No tienes permiso para acceder a esta conversación" });
  }

  next();
};
