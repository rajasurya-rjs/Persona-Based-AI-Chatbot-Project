import dotenv from "dotenv";
import { createApp } from "./app.js";
import { createLlmClient } from "./llmClient.js";

dotenv.config();

const port = Number(process.env.PORT || 8080);
const llmApiKey = process.env.LLM_API_KEY || process.env.GITHUB_TOKEN || "";
const llmBaseUrl = process.env.LLM_BASE_URL || "https://models.github.ai/inference";
const llmModel = process.env.LLM_MODEL || "openai/gpt-4.1";
const githubApiVersion = process.env.GITHUB_API_VERSION || "2022-11-28";

const llmClient = createLlmClient({
  apiKey: llmApiKey,
  baseUrl: llmBaseUrl,
  model: llmModel,
  githubApiVersion,
});

const app = createApp({
  llmClient,
  corsOrigin: process.env.CORS_ORIGIN || "*",
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
