import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { OpenAI } from "openai";
import { NextRequest } from "next/server";
import { DashScopeCompatibleAdapter } from "./dashscope-compatible-adapter";

const dashscope = new OpenAI({
  apiKey: process.env.DASHSCOPE_API_KEY!,
  baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
});

const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: new DashScopeCompatibleAdapter({
      openai: dashscope,
      model: "qwen-plus",
      disableParallelToolCalls: true,
      keepSystemRole: true,
    }),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};