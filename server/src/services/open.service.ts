// server/services/openai.service.ts
import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

export class OpenAIService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || "http://127.0.0.1:39281/v1",
    });
  }

  /**
   * Genera una respuesta de chat basada en los mensajes proporcionados
   * @param messages Lista de mensajes de la conversación
   * @param stream Si debe transmitirse la respuesta
   * @returns Respuesta completa o stream de la respuesta
   */
  async generateChatCompletion(
    messages: ChatCompletionMessageParam[],
    stream = false
  ): Promise<any> {
    // Se retorna directamente la respuesta de la API sin tipado explícito
    return await this.openai.chat.completions.create({
      model:
        process.env.OPENAI_MODEL ||
        "unsloth:Llama-3.2-3B-Instruct-GGUF:Llama-3.2-3B-Instruct-Q4_K_M.gguf",
      messages,
      temperature: 0.7,
      max_tokens: 3000,
      stream,
    });
  }

  /**
   * Analiza un PDF y extrae información relevante
   * @param pdfText Texto del PDF
   * @returns Análisis del documento
   */
  async analyzeDocument(pdfText: string): Promise<Record<string, any>> {
    const prompt = `
      Analiza el siguiente documento y extrae información clave:
      
      ${pdfText.substring(0, 15000)} // Limitar para no exceder tokens
      
      Proporciona un análisis que incluya:
      1. Resumen breve del documento
      2. Tipo de documento (contrato, factura, artículo, etc.)
      3. Entidades mencionadas (personas, organizaciones)
      4. Fechas importantes
      5. Términos o condiciones importantes
      
      Responde en formato JSON con estas claves: summary, documentType, entities, dates, keyTerms
    `;

    const response = await this.openai.chat.completions.create({
      model:
        process.env.OPENAI_MODEL ||
        "unsloth:Llama-3.2-3B-Instruct-GGUF:Llama-3.2-3B-Instruct-Q4_K_M.gguf",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente especializado en análisis de documentos. Responde siempre en formato JSON válido.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No se recibió respuesta del modelo");
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      console.error("Error al parsear respuesta JSON:", error);
      throw new Error("Formato de respuesta inválido");
    }
  }

  /**
   * Genera preguntas relevantes sobre un documento
   * @param pdfText Texto del PDF
   * @returns Lista de preguntas sugeridas
   */
  async generateDocumentQuestions(pdfText: string): Promise<string[]> {
    const prompt = `
      Lee el siguiente texto extraído de un documento y genera 5 preguntas relevantes que alguien podría tener sobre este documento:
      
      ${pdfText.substring(0, 10000)} // Limitar para no exceder tokens
      
      Genera 5 preguntas específicas y relevantes sobre el contenido. Responde en formato JSON como un array de strings.
    `;

    const response = await this.openai.chat.completions.create({
      model:
        process.env.OPENAI_MODEL ||
        "unsloth:Llama-3.2-3B-Instruct-GGUF:Llama-3.2-3B-Instruct-Q4_K_M.gguf",
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente que genera preguntas relevantes sobre documentos. Responde en formato JSON válido como array de strings.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new Error("No se recibió respuesta del modelo");
    }

    try {
      const questions = JSON.parse(content);
      return Array.isArray(questions) ? questions : questions.questions || [];
    } catch (error) {
      console.error("Error al parsear respuesta JSON:", error);
      throw new Error("Formato de respuesta inválido");
    }
  }
}

// Exportar una instancia singleton
export default new OpenAIService();
