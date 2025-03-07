// server/middleware/validation.ts
import { Request, Response, NextFunction } from "express";
import { validationResult, body } from "express-validator";
import { ValidationError } from "express-validator";

interface MyValidationError {
  param: string;
  msg: string;
  // Otras propiedades si se requieren
}
/**
 * Validate message input
 */
export const validateMessageInput = [
  body("content")
    .optional()
    .isString()
    .withMessage("El contenido debe ser una cadena de texto")
    .trim()
    .notEmpty()
    .withMessage("El contenido no puede estar vacío"),

  body("role")
    .optional()
    .isIn(["system", "user", "assistant", "function"])
    .withMessage("El rol debe ser system, user, assistant o function"),

  body("title")
    .optional()
    .isString()
    .withMessage("El título debe ser una cadena de texto")
    .trim(),
];

/**
 * Handle validation errors
 */
export const handleInputErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      errors: errors.array().map((error) => ({
        field: (error as any).param || "",
        message: error.msg,
      })),
    });

    return; // Asegura que no continúe la ejecución
  }

  next(); // Llamar a next() para continuar con la siguiente función middleware
};
