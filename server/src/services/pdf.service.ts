// server/services/pdf.service.ts
import { getDocument } from "pdfjs-dist";
import redisService from "./redis.service.js";

export class PDFService {
  /**
   * Extrae texto de un PDF almacenado en Redis
   * @param fileKey Clave del archivo en Redis
   * @returns Texto extraído del PDF
   */
  public static async extractTextFromPDF(fileKey: string): Promise<string> {
    try {
      // Obtener el archivo de Redis
      const fileBase64 = await redisService.get(fileKey);
      if (!fileBase64) {
        throw new Error(`Archivo no encontrado en Redis con clave: ${fileKey}`);
      }

      // Convertir de base64 a Buffer y luego a Uint8Array
      const fileBuffer = Buffer.from(fileBase64, "base64");
      const fileData = new Uint8Array(fileBuffer);

      // Verificar si es un PDF válido
      const header = Buffer.from(fileData.slice(0, 4)).toString();
      if (header !== "%PDF") {
        throw new Error("El archivo no es un PDF válido");
      }

      // Procesar el PDF con pdfjs-dist
      const pdf = await getDocument({ data: fileData }).promise;
      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n";
      }

      // Verificar que se haya extraído texto
      if (!text || text.trim().length === 0) {
        throw new Error("No se pudo extraer texto del PDF");
      }

      return text;
    } catch (error) {
      console.error("Error al extraer texto del PDF:", error);
      throw new Error(
        `Error al procesar el PDF: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Guarda un archivo PDF en Redis
   * @param userId ID del usuario
   * @param fileBuffer Buffer del archivo
   * @returns Clave del archivo en Redis
   */
  public static async storePDFInRedis(
    userId: string,
    fileBuffer: Buffer
  ): Promise<string> {
    try {
      const fileKey = `pdf:${userId}:${Date.now()}`;
      const fileBase64 = fileBuffer.toString("base64");

      await redisService.set(fileKey, fileBase64);
      await redisService.expire(fileKey, 86400); // Expiración de 24 horas

      return fileKey;
    } catch (error) {
      console.error("Error al almacenar PDF en Redis:", error);
      throw new Error(
        `Error al almacenar PDF: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
