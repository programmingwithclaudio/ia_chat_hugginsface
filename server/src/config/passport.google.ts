// src/config/passport.google.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User, { IUser } from "../models/user.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Buscar usuario por externalId (Google ID)
        let user = await User.findOne({ externalId: profile.id });

        if (!user) {
          // Verificar si existe un usuario con el mismo email
          const existingUser = await User.findOne({
            email:
              profile.emails && profile.emails[0]
                ? profile.emails[0].value
                : "",
          });

          if (existingUser) {
            // Si existe usuario con el mismo email pero diferente método, actualizar
            existingUser.authProvider = "google";
            existingUser.externalId = profile.id;
            existingUser.profilePicture =
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : existingUser.profilePicture;
            await existingUser.save();
            return done(null, existingUser);
          }

          // Crear nuevo usuario con Google
          user = await User.create({
            externalId: profile.id,
            authProvider: "google",
            email:
              profile.emails && profile.emails[0]
                ? profile.emails[0].value
                : "",
            displayName: profile.displayName || "Usuario de Google",
            profilePicture:
              profile.photos && profile.photos[0]
                ? profile.photos[0].value
                : undefined,
            isPremium: false,
          });
        }

        done(null, user);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: Express.User, done) => {
  done(null, (user as IUser)._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
