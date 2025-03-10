# IA Chat App with Hugging Face

[![Status: En Desarrollo](https://img.shields.io/badge/status-en_desarrollo-orange)](https://github.com/programmingwithclaudio/ia_chat_langchain)
[![Fecha Límite](https://img.shields.io/badge/plazo-15%2F03%2F2024-red)](https://github.com/programmingwithclaudio/ia_chat_langchain)

Aplicación de chat inteligente con capacidades de IA utilizando LangChain, base para proyectos posteriores.

## 🛠️ Requerimientos Técnicos

- **Bases de Datos:**
  - 🍃 MongoDB (Almacenamiento principal)
  - 🧠 Redis (Cache y sesiones)
- **Dependencias Clave:**
  - [menloltd/cortex](https://github.com/menloltd/cortex) (Procesamiento de IA)
  - LangChain (Flujos conversacionales)
  - Next.js (Frontend)

## 📌 Plan de Implementación

| Etapa                       | Estado         | Detalle                        |
| --------------------------- | -------------- | ------------------------------ |
| 1. Sistema de Autenticación | ✅ Completado  | Login con JWT y OAuth 2.0      |
| 2. Núcleo de IA             | 🚧 En Progreso | Integración LangChain + Cortex |
| 3. Diseño de Interfaces     | ⏳ 30%         | Sistema de Chat Responsivo     |
| 4. Deployment               | 🗓️ Pendiente   | Configuración Vercel           |

## 📅 Cronograma

```mermaid
gantt
    title Cronograma de Desarrollo
    dateFormat  YYYY-MM-DD
    section Implementación
    Autenticación           :done, 2025-03-04, 2025-03-08
    Backend IA              :active, 2025-03-08, 2025-03-12
    Frontend                : 2025-03-10, 2025-03-14
    Deployment              : 2025-03-14, 2025-03-15
```

## 🔍 Referencias Clave

- [Documentación LangChain](https://langchain.com/docs)
- [Arquitectura Cortex](https://hub.docker.com/r/menloltd/cortex)
- [cortex-plataforma-de-la-ia-albertcoronado](https://www.albertcoronado.com/2024/12/03/cortex-plataforma-de-ia-para-desplegar-llms-en-local)

## 🚀 Cómo Contribuir

1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Configura variables de entorno (.env)
4. Inicia servidores de `mongo`, `redis` y la `IA`: `docker-compose up -d`
5. Ejecuta la app: `npm run dev`

- **Nota:** Images en servidores :
  - [utils-base-de-datos](https://github.com/programmingwithclaudio/utils-developers)
  - ```bash
    docker run -it -d --name cortex -v cortex_data:/root/cortexcpp -p 39281:39281 menloltd/cortex
    docker exec -it cortex /usr/local/bin/cortex run unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF
    # opcion 4 de modelo Llama
    docker exec -it cortex /usr/local/bin/cortex ps
    # activar
    docker exec -it cortex /usr/local/bin/cortex models start unsloth:Llama-3.2-3B-Instruct-GGUF:Llama-3.2-3B-Instruct-Q4_K_M.gguf
    ```
  - Recomendaciones: Si sabes configura GPU, pero si estas empezando a integrar servicios de ia en el desarrollo utiliza el procesador y la RAM por defecto como en el `bash`.
