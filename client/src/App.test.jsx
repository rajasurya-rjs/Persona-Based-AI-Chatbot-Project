import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function mockSuccessReply(text = "This is a persona reply. What should we tackle next?") {
  return {
    ok: true,
    json: async () => ({ reply: text, personaId: "anshuman" }),
  };
}

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("shows active persona and updates it on switch", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue(mockSuccessReply());

    render(<App />);

    expect(screen.getByLabelText(/active persona/i)).toHaveTextContent("Anshuman Singh");

    await user.click(screen.getByRole("tab", { name: /abhimanyu/i }));
    expect(screen.getByLabelText(/active persona/i)).toHaveTextContent("Abhimanyu Saxena");
  });

  it("preserves separate conversation threads for each persona", async () => {
    const user = userEvent.setup();
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockSuccessReply("Anshuman reply. What next?"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: "Kshitij reply. What should we solve now?", personaId: "kshitij" }),
      });

    render(<App />);

    await user.type(screen.getByPlaceholderText(/ask anshuman/i), "How do I prepare for interviews?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText(/anshuman reply/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: /kshitij/i }));
    expect(screen.queryByText(/how do i prepare for interviews/i)).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/ask kshitij/i), "Help me learn recursion");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText(/kshitij reply/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: /anshuman/i }));
    expect(screen.getByText(/how do i prepare for interviews/i)).toBeInTheDocument();
    expect(screen.getByText(/anshuman reply/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /kshitij/i }));
    expect(screen.getByText(/help me learn recursion/i)).toBeInTheDocument();
    expect(screen.getByText(/kshitij reply/i)).toBeInTheDocument();
  });

  it("shows typing indicator while waiting for response", async () => {
    const user = userEvent.setup();
    let resolver;

    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolver = resolve;
        })
    );

    render(<App />);

    await user.type(screen.getByPlaceholderText(/ask anshuman/i), "Help me plan");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByLabelText(/assistant is typing/i)).toBeInTheDocument();

    resolver(mockSuccessReply("Done response. What next?"));

    await waitFor(() => {
      expect(screen.queryByLabelText(/assistant is typing/i)).not.toBeInTheDocument();
    });
  });

  it("renders friendly error and allows retry", async () => {
    const user = userEvent.setup();
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "The AI service is unavailable right now.", code: "UPSTREAM_HTTP_ERROR" }),
      })
      .mockResolvedValueOnce(mockSuccessReply("Recovered answer. What else?"));

    render(<App />);

    await user.type(screen.getByPlaceholderText(/ask anshuman/i), "Need help");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("The AI service is unavailable right now.");
    });

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.getByText(/recovered answer/i)).toBeInTheDocument();
    });
  });
});
