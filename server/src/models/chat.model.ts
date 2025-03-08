// server/models/chat.model.ts
import { Schema, model, Document, Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Definir la interfaz para Mensajes
export interface IMessage {
  id: string;
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
  createdAt: Date;
}

// Definir la interfaz para Chats
export interface IChat extends Document {
  userId: Types.ObjectId;
  title: string;
  messages: IMessage[];
  documentId?: string; // Referencia al documento PDF (opcional)
  documentContext?: string; // Contexto extraído del documento (opcional)
  createdAt: Date;
  updatedAt: Date;
}

// Esquema para mensajes (como subdocumento)
const MessageSchema = new Schema({
  id: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["system", "user", "assistant", "function"],
  },
  content: { type: String, required: true },
  name: { type: String }, // Solo requerido para mensajes de función
  createdAt: { type: Date, default: Date.now },
});

// Esquema principal para chats

const ChatSchema = new Schema(
  {
    uuid: { type: String, default: uuidv4, unique: true, index: true }, // Índice en uuid
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Índice en userId
    },
    title: { type: String, required: true, default: "Nueva conversación" },
    messages: [MessageSchema],
    documentId: { type: String },
    documentContext: { type: String },
  },
  { timestamps: true }
);

// Índices para mejorar el rendimiento de consultas
ChatSchema.index({ uuid: 1, userId: 1 });

export default model<IChat>("Chat", ChatSchema);
