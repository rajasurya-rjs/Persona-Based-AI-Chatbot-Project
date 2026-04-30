import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createLlmClient } from "./llmClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const port = Number(process.env.PORT || 8080);
const llmApiKey = process.env.LLM_API_KEY || process.env.GITHUB_TOKEN || "";
const llmBaseUrl = process.env.LLM_BASE_URL || "https://models.github.ai/inference";
const llmModel = process.env.LLM_MODEL || "openai/gpt-4.1";
const githubApiVersion = process.env.GITHUB_API_VERSION || "2022-11-28";

if (!llmApiKey) {
  console.warn(
    "LLM key missing. Add GITHUB_TOKEN in .env (repo root or server/.env) to enable model calls."
  );
}

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
