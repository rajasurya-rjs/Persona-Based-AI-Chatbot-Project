import test from "node:test";
import assert from "node:assert/strict";
import { createChatHandler } from "../src/app.js";
import { LlmClientError } from "../src/llmClient.js";

function makeResponseMock() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("returns reply for valid payload", async () => {
  const llmClient = {
    generateReply: async () => "Here is a response in persona style. What do you want to do next?",
  };

  const handler = createChatHandler({ llmClient });
  const req = {
    body: {
      personaId: "anshuman",
      message: "How should I start?",
      history: [],
    },
  };
  const res = makeResponseMock();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.personaId, "anshuman");
  assert.equal(typeof res.body.reply, "string");
  assert.ok(res.body.reply.length > 0);
});

test("returns 400 for invalid persona", async () => {
  const llmClient = {
    generateReply: async () => "unused",
  };

  const handler = createChatHandler({ llmClient });
  const req = {
    body: {
      personaId: "random",
      message: "Hi",
      history: [],
    },
  };
  const res = makeResponseMock();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, "INVALID_PERSONA");
});

test("returns 400 for missing message", async () => {
  const llmClient = {
    generateReply: async () => "unused",
  };

  const handler = createChatHandler({ llmClient });
  const req = {
    body: {
      personaId: "kshitij",
      history: [],
    },
  };
  const res = makeResponseMock();

  await handler(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, "MISSING_MESSAGE");
});

test("handles upstream failures gracefully", async () => {
  const llmClient = {
    generateReply: async () => {
      throw new LlmClientError("upstream failure", {
        status: 502,
        code: "UPSTREAM_HTTP_ERROR",
      });
    },
  };

  const handler = createChatHandler({ llmClient });
  const req = {
    body: {
      personaId: "abhimanyu",
      message: "Hello",
      history: [],
    },
  };
  const res = makeResponseMock();

  await handler(req, res);

  assert.equal(res.statusCode, 502);
  assert.equal(res.body.code, "UPSTREAM_HTTP_ERROR");
  assert.equal(
    res.body.error,
    "The AI service is unavailable right now. Please retry in a moment."
  );
});
