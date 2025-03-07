// types/chatMessage.ts
export type ChatCompletionSystemMessageParam = {
  role: "system";
  content: string;
};

export type ChatCompletionUserMessageParam = {
  role: "user";
  content: string;
};

export type ChatCompletionAssistantMessageParam = {
  role: "assistant";
  content: string;
};

export type ChatCompletionFunctionMessageParam = {
  role: "function";
  content: string;
  name: string; // obligatorio
};

export type ChatCompletionMessageParam =
  | ChatCompletionSystemMessageParam
  | ChatCompletionUserMessageParam
  | ChatCompletionAssistantMessageParam
  | ChatCompletionFunctionMessageParam;
