// server/src/types/express.d.ts
import { Express } from "express-serve-static-core";
import { IUser } from "../models/user.model";
import { IChat } from "../models/chat.model.js"; // Asegúrate de importar el modelo Chat
import { Document } from "mongoose";

declare global {
  namespace Express {
    interface User extends IUser {}

    interface Request {
      user?: IUser;
      chat?: IChat & Document;
      isAuthenticated?(): boolean;
      logout?(done: (err: any) => void): void;
      session?: any;
    }
  }
}
