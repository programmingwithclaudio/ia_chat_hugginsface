// server/routes/chat.routes.ts
import { Router } from "express";
import express from "express"; // Importar express para el tipo RequestHandler
import { ChatController } from "../controllers/chat.controller.js";
import { uploadMiddleware } from "../controllers/chat.controller.js";

const router = Router();

// Configuración correcta de rutas con tipado explícito
router.get("/chats", ChatController.getAllChats as express.RequestHandler);
router.get(
  "/chats/:chatId",
  ChatController.getChatById as express.RequestHandler
);
router.post("/chats", ChatController.createChat as express.RequestHandler);
router.delete(
  "/chats/:chatId",
  ChatController.deleteChat as express.RequestHandler
);
router.delete(
  "/chats",
  ChatController.deleteAllChats as express.RequestHandler
);
router.post(
  "/chats/:chatId/messages",
  ChatController.sendMessage as express.RequestHandler
);
router.post(
  "/upload",
  uploadMiddleware as express.RequestHandler,
  ChatController.uploadDocument as express.RequestHandler
);

export default router;
