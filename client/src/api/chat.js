const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8080";

export async function requestChatReply({ personaId, message, history }) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ personaId, message, history }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = payload.error || "Failed to get response from the AI service.";
    const error = new Error(errorMessage);
    error.code = payload.code || "REQUEST_FAILED";
    throw error;
  }

  return payload;
}
