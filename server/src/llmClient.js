class LlmClientError extends Error {
  constructor(message, { status = 500, code = "LLM_ERROR", details } = {}) {
    super(message);
    this.name = "LlmClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) {
    return "https://models.github.ai/inference";
  }
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function isGitHubModelsUrl(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    return parsed.hostname === "models.github.ai";
  } catch {
    return baseUrl.includes("models.github.ai");
  }
}

function normalizeReplyContent(content) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part.text === "string") {
          return part.text;
        }
        return "";
      })
      .join(" ")
      .trim();
  }

  return "";
}

export function createLlmClient({
  apiKey,
  baseUrl,
  model,
  timeoutMs = 30000,
  githubApiVersion = "2022-11-28",
}) {
  const resolvedBaseUrl = normalizeBaseUrl(baseUrl);
  const githubMode = isGitHubModelsUrl(resolvedBaseUrl);

  return {
    async generateReply(messages) {
      if (!apiKey || !model) {
        throw new LlmClientError("LLM client is not configured.", {
          status: 500,
          code: "CONFIG_ERROR",
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let response;
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        };

        if (githubMode) {
          headers.Accept = "application/vnd.github+json";
          headers["X-GitHub-Api-Version"] = githubApiVersion;
        }

        response = await fetch(`${resolvedBaseUrl}/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
          }),
          signal: controller.signal,
        });
      } catch (error) {
        if (error.name === "AbortError") {
          throw new LlmClientError("LLM request timed out.", {
            status: 504,
            code: "UPSTREAM_TIMEOUT",
          });
        }

        throw new LlmClientError("Unable to connect to the LLM provider.", {
          status: 502,
          code: "UPSTREAM_NETWORK_ERROR",
          details: error.message,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const text = await response.text();
      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!response.ok) {
        throw new LlmClientError("LLM provider returned an error.", {
          status: response.status,
          code: "UPSTREAM_HTTP_ERROR",
          details: data,
        });
      }

      const rawContent = data?.choices?.[0]?.message?.content;
      const reply = normalizeReplyContent(rawContent);

      if (!reply) {
        throw new LlmClientError("LLM returned an empty response.", {
          status: 502,
          code: "EMPTY_MODEL_RESPONSE",
          details: data,
        });
      }

      return reply;
    },
  };
}

export { LlmClientError };
