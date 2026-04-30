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
  });

  it("shows active persona and updates it on switch", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue(mockSuccessReply());

    render(<App />);

    expect(screen.getByLabelText(/active persona/i)).toHaveTextContent("Anshuman Singh");

    await user.click(screen.getByRole("tab", { name: /abhimanyu/i }));
    expect(screen.getByLabelText(/active persona/i)).toHaveTextContent("Abhimanyu Saxena");
  });

  it("clears conversation when persona is switched", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue(mockSuccessReply());

    render(<App />);

    await user.type(screen.getByPlaceholderText(/ask anshuman/i), "How do I prepare?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText(/persona reply/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: /kshitij/i }));
    expect(screen.queryByText("How do I prepare?")).not.toBeInTheDocument();
    expect(screen.queryByText(/persona reply/i)).not.toBeInTheDocument();
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
