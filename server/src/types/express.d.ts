// server/src/types/express.d.ts
import { Express } from "express-serve-static-core";
import { IUser } from "../models/user.model";


declare global {
  namespace Express {
    interface User extends IUser {}

    interface Request {
      user?: IUser;
      isAuthenticated?(): boolean;
      logout?(done: (err: any) => void): void;
      session?: any;
    }
  }
}
