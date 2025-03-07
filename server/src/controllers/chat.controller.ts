// server/controllers/chat.controller.ts
import express, { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import Chat, { IChat } from "../models/chat.model.js";
import Document from "../models/document.model.js";
import { PDFService } from "../services/pdf.service.js";
import OpenAIService from "../services/open.service.js";
import { IUser } from "../models/user.model.js";
import multer from "multer";
import {
  ChatCompletionMessageParam,
  ChatCompletionFunctionMessageParam,
} from "../types/chat.message.js";

// Configuración de multer para la carga de archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limite
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
      const error = new Error("Solo se permiten archivos PDF");
      (error as any).code = "FILE_TYPE_ERROR";
      cb(error);
    }
  },
}).single("document");

// Middleware para procesar la carga de archivos
export const uploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload(req, res, (err) => {
    if (err) {
      if ((err as any).code === "FILE_TYPE_ERROR") {
        res.status(400).json({ error: err.message });
        return;
      }
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            error: "El archivo excede el tamaño máximo permitido (10MB)",
          });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: "Error al subir el archivo" });
      return;
    }
    next();
  });
};

export class ChatController {
  /**
   * Obtiene todos los chats del usuario autenticado
   */
  static async getAllChats(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const chats = await Chat.find({ userId: user._id })
        .sort({ updatedAt: -1 })
        .select("-messages")
        .exec();

      res.status(200).json({
        message: "Chats recuperados exitosamente",
        chats,
      });
    } catch (error) {
      console.error("Error en getAllChats:", error);
      res.status(500).json({
        message: "Error al obtener los chats",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  /**
   * Obtiene un chat específico por ID
   */
  // Modificar todos los métodos para usar el patrón correcto de Express
  static async getChatById(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const { chatId } = req.params;

      const chat = await Chat.findOne({
        $or: [{ _id: chatId }, { uuid: chatId }],
        userId: user._id,
      });

      if (!chat) {
        res.status(404).json({ message: "Chat no encontrado" });
        return; // Solo usar return para control de flujo
      }

      res.status(200).json({
        message: "Chat recuperado exitosamente",
        chat,
      });
    } catch (error) {
      console.error("Error en getChatById:", error);
      res.status(500).json({
        message: "Error al obtener el chat",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Repetir el mismo patrón para todos los métodos

  /**
   * Crea un nuevo chat
   */
  static async createChat(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const { title } = req.body;

      // Crear nuevo chat
      const newChat = await Chat.create({
        userId: user._id,
        title: title || "Nueva conversación",
        messages: [],
      });

      res.status(201).json({
        message: "Chat creado exitosamente",
        chat: newChat,
      });
      return;
    } catch (error) {
      console.error("Error en createChat:", error);
      res.status(500).json({
        message: "Error al crear el chat",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
      return;
    }
  }

  /**
   * Elimina un chat específico por ID
   */
  static async deleteChat(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const { chatId } = req.params;

      // Eliminar chat por ID y verificar que pertenezca al usuario
      const result = await Chat.deleteOne({
        $or: [{ _id: chatId }, { uuid: chatId }],
        userId: user._id,
      });

      if (result.deletedCount === 0) {
        res.status(404).json({ message: "Chat no encontrado" });
        return;
      }

      res.status(200).json({
        message: "Chat eliminado exitosamente",
      });
      return;
    } catch (error) {
      console.error("Error en deleteChat:", error);
      res.status(500).json({
        message: "Error al eliminar el chat",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
      return;
    }
  }

  /**
   * Elimina todos los chats del usuario
   */
  static async deleteAllChats(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;

      // Eliminar todos los chats del usuario
      await Chat.deleteMany({ userId: user._id });

      res.status(200).json({
        message: "Todos los chats han sido eliminados",
      });
      return;
    } catch (error) {
      console.error("Error en deleteAllChats:", error);
      res.status(500).json({
        message: "Error al eliminar los chats",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
      return;
    }
  }

  /**
   * Envía un mensaje a un chat y obtiene respuesta del modelo AI
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;
      const { chatId } = req.params;
      const { message, stream: useStream = false } = req.body;

      if (!message || typeof message !== "string") {
        res.status(400).json({ message: "El mensaje es requerido" });
        return;
      }

      // Buscar el chat por _id o uuid
      const chat = await Chat.findOne({
        $or: [{ _id: chatId }, { uuid: chatId }],
        userId: user._id.toString(),
      });
      if (!chat) {
        res.status(404).json({ message: "Chat no encontrado" });
        return;
      }

      // Agregar mensaje del usuario
      const userMessage = {
        id: uuidv4(),
        role: "user" as const,
        content: message,
        createdAt: new Date(),
      };
      chat.messages.push(userMessage);
      await chat.save();

      // Construcción del historial para OpenAI usando nuestro tipo
      const chatMessages: ChatCompletionMessageParam[] = chat.messages.map(
        (msg) => {
          if (msg.role === "function") {
            if (!msg.name) {
              throw new Error("Function message requires name");
            }
            return { role: msg.role, content: msg.content, name: msg.name };
          }
          return { role: msg.role, content: msg.content };
        }
      );

      // Agregar contexto del documento si existe
      if (chat.documentContext) {
        chatMessages.unshift({
          role: "system",
          content: `Contexto del documento: ${chat.documentContext.substring(
            0,
            4000
          )}...`,
        });
      }

      if (useStream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const aiMessageId = uuidv4();
        let fullContent = "";
        res.write(
          JSON.stringify({ messageId: aiMessageId, status: "start" }) + "\n\n"
        );

        // Nota: Se hace cast a any para evitar conflictos de tipado con el SDK
        const openaiStream = await OpenAIService.generateChatCompletion(
          chatMessages as any,
          true
        );

        if (openaiStream && Symbol.asyncIterator in openaiStream) {
          for await (const chunk of openaiStream as AsyncIterable<any>) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              res.write(
                JSON.stringify({
                  messageId: aiMessageId,
                  status: "streaming",
                  content,
                }) + "\n\n"
              );
            }
          }
        } else {
          throw new Error("La respuesta de OpenAI no es un stream válido.");
        }

        // Guardar mensaje en MongoDB
        const aiMessage = {
          id: aiMessageId,
          role: "assistant" as const,
          content: fullContent,
          createdAt: new Date(),
        };
        chat.messages.push(aiMessage);
        await chat.save();

        res.write(
          JSON.stringify({
            messageId: aiMessageId,
            status: "complete",
            content: fullContent,
          }) + "\n\n"
        );
        res.end();
        return;
      }

      // Modo sin streaming
      const aiResponse = (await OpenAIService.generateChatCompletion(
        chatMessages as any,
        false
      )) as any;
      const aiMessageId = uuidv4();
      if (!aiResponse?.choices?.[0]?.message?.content) {
        throw new Error("Respuesta inválida de OpenAI");
      }
      const aiMessage = {
        id: aiMessageId,
        role: "assistant" as const,
        content: aiResponse.choices[0].message.content,
        createdAt: new Date(),
      };
      chat.messages.push(aiMessage);
      await chat.save();

      res.json({ messageId: aiMessageId, content: aiMessage.content });
      return;
    } catch (error) {
      console.error("Error en sendMessage:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
      return;
    }
  }
  /**
   * Carga un documento PDF y crea un nuevo chat basado en él
   */
  static async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as IUser;

      if (!req.file) {
        res
          .status(400)
          .json({ message: "No se ha proporcionado ningún archivo" });
        return;
      }

      // Almacenar PDF en Redis
      const fileKey = await PDFService.storePDFInRedis(
        user._id.toString(),
        req.file.buffer
      );

      // Extraer texto del PDF
      const pdfText = await PDFService.extractTextFromPDF(fileKey);

      // Analizar el documento
      const analysis = await OpenAIService.analyzeDocument(pdfText);

      // Guardar documento en la base de datos
      const document = await Document.create({
        userId: user._id,
        filename: req.file.originalname,
        fileType: "pdf",
        fileKey,
        textContent: pdfText,
      });

      // Crear un chat basado en el documento
      const documentSummary = analysis.summary || "Documento sin resumen";
      const documentType = analysis.documentType || "Documento";

      const chat = await Chat.create({
        userId: user._id,
        title: `${documentType}: ${req.file.originalname}`,
        messages: [
          {
            id: uuidv4(),
            role: "system",
            content: `Análisis inicial del documento. ${documentSummary}`,
            createdAt: new Date(),
          },
        ],
        documentId: document._id,
        documentContext: pdfText,
      });

      // Generar preguntas sugeridas sobre el documento
      const suggestedQuestions = await OpenAIService.generateDocumentQuestions(
        pdfText
      );

      res.status(201).json({
        message: "Documento cargado exitosamente",
        chat,
        document: {
          id: document._id,
          filename: document.filename,
          analysis,
        },
        suggestedQuestions,
      });
      return;
    } catch (error) {
      console.error("Error en uploadDocument:", error);
      res.status(500).json({
        message: "Error al cargar el documento",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
      return;
    }
  }
}
