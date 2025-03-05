// server/models/user.model.ts
import { Document, model, Schema } from "mongoose";

export interface IUser extends Document {
  externalId?: string; // ID de Google, Facebook, etc.
  authProvider: "manual" | "google"; // Indica el tipo de autenticación
  email: string;
  password?: string; // Opcional para autenticación con Google
  displayName: string;
  profilePicture?: string;
  isPremium: boolean;
}

const UserSchema: Schema = new Schema(
  {
    authProvider: {
      type: String,
      enum: ["manual", "google"],
      required: true,
      default: "manual",
    },
    externalId: { type: String, unique: true, sparse: true }, // Solo si se usa autenticación externa
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Opcional para permitir auth con Google
    displayName: { type: String, required: true },
    profilePicture: { type: String },
    isPremium: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<IUser>("User", UserSchema);
