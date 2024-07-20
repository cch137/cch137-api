import { config } from "dotenv";
import createEntangleServer from "@cch137/entangle/server.js";

import type {
  ChatCompletionCreateParamsBase,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from "groq-sdk/resources/chat/completions.mjs";
import type { APIPromise } from "groq-sdk/core.mjs";
import type { Stream } from "groq-sdk/lib/streaming.mjs";
import Groq from "groq-sdk";

config();

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type GroqProxy = {
  readonly create: (
    body: ChatCompletionCreateParamsNonStreaming,
    options?: Groq.RequestOptions
  ) => APIPromise<Groq.Chat.Completions.ChatCompletion>;
};

export const completions = createEntangleServer<GroqProxy>(
  {
    create(
      body: ChatCompletionCreateParamsNonStreaming,
      options?: Groq.RequestOptions
    ) {
      return groq.chat.completions.create(body, options);
    },
  },
  {
    permissions: [{ key: "create", readable: true, writable: false }],
  }
);

export default groq;
