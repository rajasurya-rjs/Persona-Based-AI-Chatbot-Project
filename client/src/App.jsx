import { useEffect, useRef, useState } from "react";
import { requestChatReply } from "./api/chat";
import { PERSONAS, PERSONA_MAP } from "./personas";

const THREADS_STORAGE_KEY = "persona_chat_threads_v2";
const ACTIVE_PERSONA_STORAGE_KEY = "persona_chat_active_persona_v1";
const MAX_STORED_MESSAGES = 60;

function createEmptyThreads() {
  return PERSONAS.reduce((acc, persona) => {
    acc[persona.id] = [];
    return acc;
  }, {});
}

function normalizeMessages(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((message) => {
      if (!message || typeof message !== "object") {
        return null;
      }

      const role = message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : null;
      const content = typeof message.content === "string" ? message.content.trim() : "";

      if (!role || !content) {
        return null;
      }

      return { role, content };
    })
    .filter(Boolean)
    .slice(-MAX_STORED_MESSAGES);
}

function readStoredThreads() {
  if (typeof window === "undefined") {
    return createEmptyThreads();
  }

  const empty = createEmptyThreads();

  try {
    const raw = window.localStorage.getItem(THREADS_STORAGE_KEY);
    if (!raw) {
      return empty;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return empty;
    }

    for (const persona of PERSONAS) {
      empty[persona.id] = normalizeMessages(parsed[persona.id]);
    }

    return empty;
  } catch {
    return empty;
  }
}

function readStoredActivePersona() {
  if (typeof window === "undefined") {
    return PERSONAS[0].id;
  }

  const saved = window.localStorage.getItem(ACTIVE_PERSONA_STORAGE_KEY);
  if (saved && PERSONA_MAP[saved]) {
    return saved;
  }

  return PERSONAS[0].id;
}

function toHistoryPayload(messages) {
  return messages.map((message) => ({ role: message.role, content: message.content }));
}

function TypingIndicator() {
  return (
    <div className="typing-indicator" aria-live="polite">
      <div className="typing-bubble" aria-label="Assistant is typing">
        <span />
        <span />
        <span />
      </div>
      <span className="typing-copy">Generating response...</span>
    </div>
  );
}

export default function App() {
  const [activePersonaId, setActivePersonaId] = useState(readStoredActivePersona);
  const [threadsByPersona, setThreadsByPersona] = useState(readStoredThreads);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [retryPayload, setRetryPayload] = useState(null);
  const messagesEndRef = useRef(null);

  const activePersona = PERSONA_MAP[activePersonaId] ?? PERSONAS[0];
  const activeMessages = threadsByPersona[activePersona.id] ?? [];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threadsByPersona));
  }, [threadsByPersona]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ACTIVE_PERSONA_STORAGE_KEY, activePersonaId);
  }, [activePersonaId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeMessages, isTyping]);

  const switchPersona = (personaId) => {
    setActivePersonaId(personaId);
    setInput("");
    setError("");
    setRetryPayload(null);
  };

  const appendMessageToPersona = (personaId, nextMessage) => {
    setThreadsByPersona((prev) => {
      const current = prev[personaId] ?? [];
      const updated = [...current, nextMessage].slice(-MAX_STORED_MESSAGES);
      return { ...prev, [personaId]: updated };
    });
  };

  const submitMessage = async (
    rawMessage,
    options = { appendUserMessage: true, requestHistory: null, personaId: activePersona.id }
  ) => {
    const cleanedMessage = rawMessage.trim();

    if (!cleanedMessage || isTyping) {
      return;
    }

    const personaIdAtRequest =
      typeof options.personaId === "string" && PERSONA_MAP[options.personaId]
        ? options.personaId
        : activePersona.id;
    const personaMessagesAtRequest = threadsByPersona[personaIdAtRequest] ?? [];
    const requestHistory = options.requestHistory ?? toHistoryPayload(personaMessagesAtRequest);

    setError("");
    setIsTyping(true);
    setInput("");

    if (options.appendUserMessage) {
      appendMessageToPersona(personaIdAtRequest, { role: "user", content: cleanedMessage });
    }

    try {
      const response = await requestChatReply({
        personaId: personaIdAtRequest,
        message: cleanedMessage,
        history: requestHistory,
      });

      appendMessageToPersona(personaIdAtRequest, {
        role: "assistant",
        content: response.reply,
      });
      setRetryPayload(null);
    } catch (requestError) {
      setRetryPayload({
        personaId: personaIdAtRequest,
        message: cleanedMessage,
        history: requestHistory,
      });
      setError(requestError.message || "Unable to send your message. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const onFormSubmit = async (event) => {
    event.preventDefault();
    await submitMessage(input, { appendUserMessage: true });
  };

  const handleSuggestionClick = async (suggestion) => {
    setInput(suggestion);
    await submitMessage(suggestion, { appendUserMessage: true });
  };

  const handleRetry = async () => {
    if (!retryPayload) {
      return;
    }

    const personaHistory = threadsByPersona[retryPayload.personaId] ?? [];

    await submitMessage(retryPayload.message, {
      appendUserMessage: false,
      personaId: retryPayload.personaId,
      requestHistory: retryPayload.history ?? toHistoryPayload(personaHistory),
    });
  };

  return (
    <div className="app-shell" data-persona={activePersona.id}>
      <div className="background-layer background-gradient" />
      <div className="background-layer background-beams" />
      <div className="background-layer background-grid" />
      <div className="background-layer background-vignette" />

      <main className="screen-wrap">
        <p className="sr-only" aria-label="Active persona">
          Active Persona: <strong>{activePersona.name}</strong>
        </p>

        <section className="persona-switcher" role="tablist" aria-label="Persona switcher">
          {PERSONAS.map((persona, index) => (
            <button
              key={persona.id}
              role="tab"
              type="button"
              aria-selected={activePersona.id === persona.id}
              className={activePersona.id === persona.id ? "persona-tab active" : "persona-tab"}
              onClick={() => switchPersona(persona.id)}
            >
              <span className="persona-index">0{index + 1}</span>
              <span className="persona-name">{persona.shortLabel}</span>
            </button>
          ))}
        </section>

        <section className="chat-frame" aria-live="polite">
          <header className="channel-strip">
            <span>{activePersona.name} channel online.</span>
          </header>

          {activeMessages.length === 0 ? (
            <section className="empty-stage">
              <div className="assistant-orb" aria-hidden="true" />
              <h1>Good to see you.</h1>
              <p>Ask anything and get persona-based guidance in real time.</p>
            </section>
          ) : (
            <section className="messages" aria-label="Chat messages">
              {activeMessages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={message.role === "user" ? "message user" : "message assistant"}
                >
                  <p>{message.content}</p>
                </article>
              ))}

              {isTyping ? <TypingIndicator /> : null}
              <div ref={messagesEndRef} />
            </section>
          )}

          <footer className="composer-zone">
            <div className="composer-meta" aria-hidden="true">
              <span className="meta-text">Connected to AI guidance channel</span>
              <span className="meta-state">
                <i className={isTyping ? "status-dot busy" : "status-dot"} />
                {isTyping ? "Responding" : "Active"}
              </span>
            </div>

            <form className="composer" onSubmit={onFormSubmit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={`Ask ${activePersona.shortLabel} anything about your tech career...`}
                rows={1}
                disabled={isTyping}
              />
              <button type="submit" disabled={isTyping || !input.trim()}>
                {isTyping ? "Thinking..." : "Send"}
              </button>
            </form>

            <div className="suggestions" aria-label="Suggestion chips">
              {activePersona.suggestionChips.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isTyping}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {error ? (
              <div className="error-bar" role="alert">
                <span>{error}</span>
                {retryPayload ? (
                  <button type="button" onClick={handleRetry} disabled={isTyping}>
                    Retry
                  </button>
                ) : null}
              </div>
            ) : null}
          </footer>
        </section>
      </main>
    </div>
  );
}
