// server/controllers/chat.controller.ts
import type { NextFunction, Request, RequestHandler, Response } from "express";
import OpenAIService from "../services/open.service.js";
import Chat, { IChat, IMessage } from "../models/chat.model.js";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import fs from "fs";
import path from "path";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const uploadMiddleware = multer({ storage });

export class ChatController {
  /**
   * Get all chats for the current user
   */
  static getAllChats: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const chats = await Chat.find({ userId: req.user.id })
        .sort({ updatedAt: -1 })
        .select("uuid title updatedAt"); // Only return necessary fields for list view

      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ error: "Error al obtener las conversaciones" });
    }
  };

  /**
   * Get a specific chat by ID
   */
  static getChatById: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const chatId = req.params.chatId;

      const chat = await Chat.findOne({
        uuid: chatId,
        userId: req.user.id,
      });

      if (!chat) {
        res.status(404).json({ error: "Conversación no encontrada" });
        return;
      }

      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat:", error);
      res.status(500).json({ error: "Error al obtener la conversación" });
    }
  };

  /**
   * Create a new chat
   */
  static createChat: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { title, initialMessage } = req.body;
      const userId = req.user.id;

      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
      }

      const messages: IMessage[] = [];

      // Add initial message if provided
      if (initialMessage) {
        messages.push({
          id: uuidv4(),
          role: "user",
          content: initialMessage,
          createdAt: new Date(),
        });
      }

      const newChat = await Chat.create({
        userId,
        title: title || "Nueva conversación",
        messages,
      });

      res.status(201).json({
        message: "Conversación creada exitosamente",
        chat: newChat,
      });
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: "Error al crear la conversación" });
    }
  };

  /**
   * Delete a specific chat
   */
  static deleteChat: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const chatId = req.params.chatId;

      const result = await Chat.deleteOne({
        uuid: chatId,
        userId: req.user.id,
      });

      if (result.deletedCount === 0) {
        res.status(404).json({ error: "Conversación no encontrada" });
        return;
      }

      res.json({ message: "Conversación eliminada correctamente" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ error: "Error al eliminar la conversación" });
    }
  };

  /**
   * Delete all chats for the current user
   */
  static deleteAllChats: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const result = await Chat.deleteMany({ userId: req.user.id });

      res.json({
        message: "Todas las conversaciones han sido eliminadas",
        count: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting all chats:", error);
      res.status(500).json({ error: "Error al eliminar las conversaciones" });
    }
  };

  /**
   * Send a message to a specific chat
   */
  static sendMessage: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const chatId = req.params.chatId;
      const { content, role = "user" } = req.body;

      if (!content) {
        res
          .status(400)
          .json({ error: "El contenido del mensaje es requerido" });
        return;
      }

      // Acceder a `req.chat` sin errores de TypeScript
      const chat = req.chat;

      if (!chat) {
        res.status(404).json({ error: "Conversación no encontrada" });
        return;
      }

      const newMessage: IMessage = {
        id: uuidv4(),
        role: role,
        content: content,
        createdAt: new Date(),
      };

      chat.messages.push(newMessage);

      // Mapear mensajes para OpenAI
      const messagesForAI: ChatCompletionMessageParam[] = chat.messages.map(
        (msg) => {
          // Validar roles permitidos
          const allowedRoles = ["system", "user", "assistant", "function"];
          if (!allowedRoles.includes(msg.role)) {
            throw new Error(`Rol de mensaje inválido: ${msg.role}`);
          }

          // For function messages, ensure name is provided
          if (msg.role === "function") {
            if (!msg.name) {
              throw new Error("Function messages must have a name");
            }
            return {
              role: msg.role,
              content: msg.content,
              name: msg.name, // This is now required, not optional
            };
          }

          // For other message types
          return {
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content,
          };
        }
      );

      // Llamar al servicio de OpenAI
      const aiResponse = await OpenAIService.generateChatCompletion(
        messagesForAI
      );

      // Extraer el contenido de la respuesta
      const aiContent = aiResponse.choices[0]?.message?.content;

      if (aiContent) {
        const aiMessage: IMessage = {
          id: uuidv4(),
          role: "assistant",
          content: aiContent,
          createdAt: new Date(),
        };

        chat.messages.push(aiMessage);
      }

      await chat.save();

      res.json({
        message: "Mensaje enviado exitosamente",
        newMessage,
        aiResponse: aiContent
          ? {
              id: chat.messages[chat.messages.length - 1].id,
              role: "assistant",
              content: aiContent,
              createdAt: chat.messages[chat.messages.length - 1].createdAt,
            }
          : null,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Error al enviar el mensaje" });
    }
  };

  /**
   * Upload a document and associate it with a chat
   */
  static uploadDocument: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No se ha enviado ningún archivo" });
        return;
      }

      const { chatId } = req.body;

      // If chatId is provided, attach the document to an existing chat
      if (chatId) {
        const chat = await Chat.findOne({
          uuid: chatId,
          userId: req.user.id,
        });

        if (!chat) {
          res.status(404).json({ error: "Conversación no encontrada" });
          return;
        }

        // Process the document and extract context here
        // For example, using a PDF library to extract text

        chat.documentId = req.file.filename;
        chat.documentContext = "Texto extraído del documento"; // Replace with actual extraction
        await chat.save();

        res.json({
          message: "Documento subido y asociado a la conversación",
          documentId: req.file.filename,
        });
      } else {
        // Create a new chat with the document
        // Process the document and extract context here

        const newChat = await Chat.create({
          userId: req.user.id,
          title: `Documento: ${req.file.originalname}`,
          messages: [],
          documentId: req.file.filename,
          documentContext: "Texto extraído del documento", // Replace with actual extraction
        });

        res.status(201).json({
          message: "Documento subido y nueva conversación creada",
          chat: newChat,
        });
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Error al subir el documento" });
    }
  };
}
