// server/routes/chat.routes.ts
import { Router } from "express";
import {
  ChatController,
  uploadMiddleware,
} from "../controllers/chat.controller.js";
import { isAuthenticated } from "../middleware/auth.js";
import {
  validateChatExists,
  validateChatId,
  hasAccess,
} from "../middleware/chat.js";
import {
  validateMessageInput,
  handleInputErrors,
} from "../middleware/validation.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated);

// Chat parameter validation
router.param("chatId", validateChatId);
router.param("chatId", validateChatExists);
router.param("chatId", hasAccess);

// Chat routes
router.get("/", ChatController.getAllChats);

router.post(
  "/",
  validateMessageInput,
  handleInputErrors,
  ChatController.createChat
);

router.get("/:chatId", ChatController.getChatById);

router.delete("/:chatId", ChatController.deleteChat);

router.delete("/", ChatController.deleteAllChats);

// Message routes
router.post(
  "/:chatId/messages",
  validateMessageInput,
  handleInputErrors,
  ChatController.sendMessage
);

// Document upload route
router.post("/upload", uploadMiddleware.single("file"), ChatController.uploadDocument);


export default router;
