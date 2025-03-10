// server/controllers/chat.controller.ts
import type { NextFunction, Request, RequestHandler, Response } from "express";
import OpenAIService from "../services/open.service.js";
import Chat, { IChat, IMessage } from "../models/chat.model.js";
import Document, { IDocument } from "../models/document.model.js";
import { PDFService } from "../services/pdf.service.js";
import { v4 as uuidv4 } from "uuid";
import multer, { FileFilterCallback } from "multer";
import fs from "fs";
import path from "path";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { Types } from "mongoose";

// Define proper types for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: Function) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: Function) => {
    // Sanitize the filename
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}-${sanitizedName}`);
  },
});

// Add file filter to only accept PDFs
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos PDF") as any);
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

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
      const { content } = req.body;

      if (!content) {
        res
          .status(400)
          .json({ error: "El contenido del mensaje es requerido" });
        return;
      }

      // Se asume que el middleware ha cargado previamente la conversación en req.chat
      const chatFromReq = req.chat;
      if (!chatFromReq) {
        res.status(404).json({ error: "Conversación no encontrada" });
        return;
      }

      const chat: IChat = chatFromReq as IChat; // Forzamos la conversión, ya que se verificó que no es undefined.

      if (!chat) {
        res.status(404).json({ error: "Conversación no encontrada" });
        return;
      }

      // Agregar el nuevo mensaje del usuario al historial de la conversación
      const newMessage: IMessage = {
        id: uuidv4(),
        role: "user",
        content,
        createdAt: new Date(),
      };
      chat.messages.push(newMessage);

      // Construir el prompt para Llama
      // Se integra el contexto del documento y el historial completo de mensajes
      let promptForAI = "";
      if (chat.documentContext) {
        promptForAI += `[SISTEMA] Contexto del documento: ${chat.documentContext}\n\n`;
      }
      chat.messages.forEach((msg) => {
        promptForAI += `[${msg.role.toUpperCase()}] ${msg.content}\n`;
      });
      // Se añade la última pregunta y se indica dónde debe comenzar la respuesta
      promptForAI += `[USUARIO] ${content}\n[ASISTENTE]`;

      // Llamar al servicio de OpenAI con el prompt formateado
      // En este caso, se envía un único mensaje con el contenido completo del prompt
      const aiResponse = await OpenAIService.generateChatCompletion([
        { role: "user", content: promptForAI },
      ]);

      // Extraer el contenido de la respuesta
      const aiContent = aiResponse.choices[0]?.message?.content || "";

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
    req: MulterRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No se ha enviado ningún archivo PDF" });
        return;
      }

      const userId = req.user.id;
      // Obtener chatId desde params o body
      const chatId = req.params.chatId || req.body.chatId;
      const filePath = req.file.path;

      // Leer el archivo
      const fileBuffer = fs.readFileSync(filePath);

      // Almacenar el PDF en Redis
      const fileKey = await PDFService.storePDFInRedis(userId, fileBuffer);

      // Extraer el contenido del PDF
      const textContent = await PDFService.extractTextFromPDF(fileKey);

      // Crear registro del documento y limitar el contexto a 1000 caracteres para la preview
      const document = await Document.create({
        userId: new Types.ObjectId(userId),
        filename: req.file.originalname,
        fileType: "application/pdf",
        fileKey,
        textContent,
      });
      const documentId = document.id.toString();

      if (chatId) {
        const chat = await Chat.findOne({
          uuid: chatId,
          userId: new Types.ObjectId(userId),
        });
        if (!chat) {
          res.status(404).json({ error: "Conversación no encontrada" });
          return;
        }
        chat.documentId = documentId;
        chat.documentContext = textContent.substring(0, 1000) + "...";
        await chat.save();

        res.json({
          message: "Documento subido y asociado a la conversación",
          documentId,
          chatId,
        });
      } else {
        const newChat = await Chat.create({
          userId: new Types.ObjectId(userId),
          uuid: uuidv4(),
          title: `Documento: ${req.file.originalname}`,
          messages: [],
          documentId,
          documentContext: textContent.substring(0, 1000) + "...",
        });
        res.status(201).json({
          message: "Documento subido y nueva conversación creada",
          chat: {
            id: newChat.id.toString(),
            uuid: newChat.get("uuid"),
            title: newChat.title,
          },
          documentId,
        });
      }

      // Eliminar el archivo temporal
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({
        error: "Error al procesar el documento",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
