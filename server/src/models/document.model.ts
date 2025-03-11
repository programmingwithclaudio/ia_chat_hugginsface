// server/models/document.model.ts
import { Schema, model, Document, Types } from "mongoose";

// Definir la interfaz para Documentos
export interface IDocument extends Document {
  userId: Types.ObjectId;
  filename: string;
  fileType: string;
  fileKey: string; // Clave en Redis
  textContent: string;
  analysis?: {
    summary: string;
    documentType: string;
    entities: string[];
    dates: string[];
    keyTerms: string[];
  };
  suggestedQuestions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Esquema para documentos
const DocumentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    filename: { type: String, required: true },
    fileType: { type: String, required: true },
    fileKey: { type: String, required: true },
    textContent: { type: String, required: true },
    analysis: {
      summary: String,
      documentType: String,
      entities: [String],
      dates: [String],
      keyTerms: [String],
    },
    suggestedQuestions: [String],
  },
  { timestamps: true }
);

// Índices para mejorar el rendimiento de consultas
DocumentSchema.index({ userId: 1, createdAt: -1 });

export default model<IDocument>("Document", DocumentSchema);
