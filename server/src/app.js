import express from "express";
import cors from "cors";
import { PERSONAS, PERSONA_IDS } from "./personas.js";
import { LlmClientError } from "./llmClient.js";

function isRoleValid(role) {
  return role === "user" || role === "assistant";
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return null;
  }

  const cleaned = [];
  for (const item of history) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const role = typeof item.role === "string" ? item.role : "";
    const content = typeof item.content === "string" ? item.content.trim() : "";

    if (!isRoleValid(role) || !content) {
      return null;
    }

    cleaned.push({ role, content });
  }

  return cleaned;
}

function toClientError(error) {
  if (error instanceof LlmClientError) {
    if (error.code === "CONFIG_ERROR") {
      return {
        status: 500,
        payload: {
          error: "Server configuration is incomplete. Please contact the administrator.",
          code: error.code,
        },
      };
    }

    return {
      status: 502,
      payload: {
        error: "The AI service is unavailable right now. Please retry in a moment.",
        code: error.code,
      },
    };
  }

  return {
    status: 500,
    payload: {
      error: "Something went wrong on our side. Please try again.",
      code: "INTERNAL_SERVER_ERROR",
    },
  };
}

export function createChatHandler({ llmClient }) {
  return async (req, res) => {
    const startedAt = Date.now();
    const logChat = (status, code) => {
      if (process.env.LOG_CHAT_REQUESTS === "false") {
        return;
      }

      const durationMs = Date.now() - startedAt;
      const persona = typeof req.body?.personaId === "string" ? req.body.personaId : "unknown";
      console.log(
        `[chat] status=${status} code=${code} persona=${persona} duration_ms=${durationMs}`
      );
    };

    const personaId = typeof req.body?.personaId === "string" ? req.body.personaId.trim() : "";
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const history = req.body?.history ?? [];

    if (!PERSONAS[personaId]) {
      logChat(400, "INVALID_PERSONA");
      return res.status(400).json({
        error: "Invalid personaId. Expected one of: anshuman, abhimanyu, kshitij.",
        code: "INVALID_PERSONA",
      });
    }

    if (!message) {
      logChat(400, "MISSING_MESSAGE");
      return res.status(400).json({
        error: "Message is required.",
        code: "MISSING_MESSAGE",
      });
    }

    const normalizedHistory = normalizeHistory(history);
    if (normalizedHistory === null) {
      logChat(400, "INVALID_HISTORY");
      return res.status(400).json({
        error: "History must be an array of { role, content } with role in [user, assistant].",
        code: "INVALID_HISTORY",
      });
    }

    const systemPrompt = PERSONAS[personaId].prompt;
    const messages = [
      { role: "system", content: systemPrompt },
      ...normalizedHistory,
      { role: "user", content: message },
    ];

    try {
      const reply = await llmClient.generateReply(messages);
      logChat(200, "OK");
      return res.status(200).json({ reply, personaId });
    } catch (error) {
      const mapped = toClientError(error);
      logChat(mapped.status, mapped.payload?.code ?? "UNKNOWN_ERROR");
      if (mapped.status >= 500 && process.env.NODE_ENV !== "test") {
        console.error("/api/chat failed", {
          code: error.code,
          message: error.message,
          details: error.details,
        });
      }
      return res.status(mapped.status).json(mapped.payload);
    }
  };
}

export function createApp({ llmClient, corsOrigin = "*" }) {
  const app = express();

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok", personas: PERSONA_IDS });
  });

  app.post("/api/chat", createChatHandler({ llmClient }));

  return app;
}
