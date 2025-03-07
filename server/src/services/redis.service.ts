// server/services/redis.service.ts
import { createClient } from "redis";

// Crear una clase singleton para manejar la conexión con Redis
class RedisService {
  private static instance: RedisService;
  private client: ReturnType<typeof createClient>;
  private isConnected: boolean = false;

  private constructor() {
    // Configuración de Redis con credenciales
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://:admin@172.21.0.3:6379",
    });

    // Manejar eventos
    this.client.on("error", (err) => console.error("Redis Client Error", err));
    this.client.on("connect", () => {
      console.log("Connected to Redis");
      this.isConnected = true;
    });
    this.client.on("end", () => {
      console.log("Disconnected from Redis");
      this.isConnected = false;
    });

    // Conectar automáticamente
    this.connect().catch(console.error);
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  // Conectar a Redis
  private async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  // Asegurar que estamos conectados antes de realizar operaciones
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  // Almacenar valor
  public async set(key: string, value: string): Promise<void> {
    await this.ensureConnection();
    await this.client.set(key, value);
  }

  // Almacenar valor con expiración
  public async setEx(
    key: string,
    seconds: number,
    value: string
  ): Promise<void> {
    await this.ensureConnection();
    await this.client.setEx(key, seconds, value);
  }

  // Obtener valor
  public async get(key: string): Promise<string | null> {
    await this.ensureConnection();
    return await this.client.get(key);
  }

  // Eliminar clave
  public async del(key: string): Promise<void> {
    await this.ensureConnection();
    await this.client.del(key);
  }

  // Establecer expiración
  public async expire(key: string, seconds: number): Promise<void> {
    await this.ensureConnection();
    await this.client.expire(key, seconds);
  }

  // Cerrar conexión (útil para pruebas o cuando se apaga la aplicación)
  public async close(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Exportar una instancia singleton
export default RedisService.getInstance();
