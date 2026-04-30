import { useEffect, useMemo, useRef, useState } from "react";
import { requestChatReply } from "./api/chat";
import { PERSONAS, PERSONA_MAP } from "./personas";

function TypingIndicator() {
  return (
    <div className="typing-indicator" aria-live="polite">
      <div className="typing-bubble" aria-label="Assistant is typing">
        <span />
        <span />
        <span />
      </div>
      <span className="typing-copy">AI is generating...</span>
    </div>
  );
}

export default function App() {
  const [activePersonaId, setActivePersonaId] = useState(PERSONAS[0].id);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [retryPayload, setRetryPayload] = useState(null);
  const messagesEndRef = useRef(null);

  const activePersona = PERSONA_MAP[activePersonaId];

  const historyPayload = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  const resetConversationForPersona = (personaId) => {
    setActivePersonaId(personaId);
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setError("");
    setRetryPayload(null);
  };

  const submitMessage = async (
    rawMessage,
    options = { appendUserMessage: true, requestHistory: null }
  ) => {
    const cleanedMessage = rawMessage.trim();

    if (!cleanedMessage || isTyping) {
      return;
    }

    setError("");

    const userMessage = { role: "user", content: cleanedMessage };
    const nextMessages = options.appendUserMessage ? [...messages, userMessage] : [...messages];

    if (options.appendUserMessage) {
      setMessages(nextMessages);
    }

    setInput("");
    setIsTyping(true);

    try {
      const response = await requestChatReply({
        personaId: activePersonaId,
        message: cleanedMessage,
        history: options.requestHistory ?? historyPayload,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
      setRetryPayload(null);
    } catch (requestError) {
      setRetryPayload({
        message: cleanedMessage,
        history: options.requestHistory ?? historyPayload,
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
    await submitMessage(retryPayload.message, {
      appendUserMessage: false,
      requestHistory: retryPayload.history,
    });
  };

  return (
    <div className="app-shell" data-persona={activePersonaId}>
      <div className="stars-layer" />
      <div className="rings-layer" />
      <div className="grid-layer" />
      <div className="vignette-layer" />

      <main className="scene-layout">
        <p className="sr-only" aria-label="Active persona">
          Active Persona: <strong>{activePersona.name}</strong>
        </p>

        <section className="persona-switcher" role="tablist" aria-label="Persona switcher">
          {PERSONAS.map((persona, index) => (
            <button
              key={persona.id}
              role="tab"
              type="button"
              aria-selected={activePersonaId === persona.id}
              className={activePersonaId === persona.id ? "persona-tab active" : "persona-tab"}
              onClick={() => resetConversationForPersona(persona.id)}
            >
              <span className="persona-index">0{index + 1}</span>
              <span className="persona-name">{persona.shortLabel}</span>
            </button>
          ))}
        </section>

        <section className="chat-card" aria-live="polite">
          <div className="messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>{activePersona.name} channel online.</p>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={message.role === "user" ? "message user" : "message assistant"}
              >
                <p>{message.content}</p>
              </article>
            ))}

            {isTyping ? <TypingIndicator /> : null}
            <div ref={messagesEndRef} />
          </div>

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

          <form className="composer" onSubmit={onFormSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Ask ${activePersona.shortLabel} anything about your tech career...`}
              rows={2}
              disabled={isTyping}
            />
            <button type="submit" disabled={isTyping || !input.trim()}>
              {isTyping ? "Thinking..." : "Send"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
