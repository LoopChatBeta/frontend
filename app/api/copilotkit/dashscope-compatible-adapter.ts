import type OpenAI from "openai";
import {
  convertServiceAdapterError,
  type CopilotRuntimeChatCompletionRequest,
  type CopilotRuntimeChatCompletionResponse,
  type CopilotServiceAdapter,
} from "@copilotkit/runtime";

type DashScopeCompatibleAdapterParams = {
  openai: OpenAI;
  model: string;
  disableParallelToolCalls?: boolean;
  keepSystemRole?: boolean;
};

export class DashScopeCompatibleAdapter implements CopilotServiceAdapter {
  public provider = "openai";
  public model: string;
  public name = "DashScopeCompatibleAdapter";

  private openai: OpenAI;
  private disableParallelToolCalls: boolean;
  private keepSystemRole: boolean;

  constructor(params: DashScopeCompatibleAdapterParams) {
    this.openai = params.openai;
    this.model = params.model;
    this.disableParallelToolCalls = params.disableParallelToolCalls ?? false;
    this.keepSystemRole = params.keepSystemRole ?? false;
  }

  async process(
    request: CopilotRuntimeChatCompletionRequest,
  ): Promise<CopilotRuntimeChatCompletionResponse> {
    const {
      threadId: threadIdFromRequest,
      model = this.model,
      messages,
      actions,
      eventSource,
      forwardedParameters,
    } = request;

    const threadId = threadIdFromRequest ?? crypto.randomUUID();

    const actionExecutionIdToName = new Map<string, string>();
    for (const message of messages) {
      if (message.isActionExecutionMessage()) {
        actionExecutionIdToName.set(message.id, message.name);
      }
    }

    const openaiMessages: any[] = messages
      .filter((message) => {
        if (message.isResultMessage()) {
          return actionExecutionIdToName.has(message.actionExecutionId);
        }
        return true;
      })
      .map((message) => {
        if (message.isTextMessage()) {
          const role = message.role;
          return { role, content: message.content };
        }

        if (message.isImageMessage()) {
          return {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/${message.format};base64,${message.bytes}` },
              },
            ],
          };
        }

        if (message.isActionExecutionMessage()) {
          return {
            role: "assistant",
            tool_calls: [
              {
                id: message.id,
                type: "function",
                function: {
                  name: message.name,
                  arguments: JSON.stringify(message.arguments),
                },
              },
            ],
          };
        }

        if (message.isResultMessage()) {
          const functionName =
            actionExecutionIdToName.get(message.actionExecutionId) ?? "tool_result";
          return {
            role: "function",
            name: functionName,
            content: message.result,
          };
        }

        return null;
      })
      .filter((message): message is NonNullable<typeof message> => message !== null);

    const tools = actions.map((action) => ({
      type: "function" as const,
      function: {
        name: action.name,
        description: action.description,
        parameters: JSON.parse(action.jsonSchema || "{}"),
      },
    }));

    let toolChoice: any = forwardedParameters?.toolChoice;
    if (forwardedParameters?.toolChoice === "function") {
      toolChoice = {
        type: "function",
        function: { name: forwardedParameters.toolChoiceFunctionName },
      };
    }

    try {
      const stream = this.openai.chat.completions.stream({
        model,
        stream: true,
        messages: openaiMessages as any,
        ...(tools.length > 0 ? { tools } : {}),
        ...(forwardedParameters?.maxTokens
          ? { max_completion_tokens: forwardedParameters.maxTokens }
          : {}),
        ...(forwardedParameters?.stop ? { stop: forwardedParameters.stop } : {}),
        ...(toolChoice ? { tool_choice: toolChoice } : {}),
        ...(this.disableParallelToolCalls ? { parallel_tool_calls: false } : {}),
        ...(forwardedParameters?.temperature
          ? { temperature: forwardedParameters.temperature }
          : {}),
      });

      eventSource.stream(async (eventStream$) => {
        let mode: "message" | "function" | null = null;
        let currentMessageId: string | undefined;
        let currentToolCallId: string | undefined;

        for await (const chunk of stream) {
          if (chunk.choices.length === 0) continue;

          const toolCall = chunk.choices[0].delta.tool_calls?.[0];
          const content = chunk.choices[0].delta.content;

          if (mode === "message" && toolCall?.id) {
            mode = null;
            if (currentMessageId) {
              eventStream$.sendTextMessageEnd({ messageId: currentMessageId });
            }
          } else if (mode === "function" && (toolCall === undefined || toolCall?.id)) {
            mode = null;
            if (currentToolCallId) {
              eventStream$.sendActionExecutionEnd({ actionExecutionId: currentToolCallId });
            }
          }

          if (mode === null) {
            if (toolCall?.id) {
              mode = "function";
              currentToolCallId = toolCall.id;
              eventStream$.sendActionExecutionStart({
                actionExecutionId: currentToolCallId,
                parentMessageId: chunk.id,
                actionName: toolCall.function?.name || "tool",
              });
            } else if (content) {
              mode = "message";
              currentMessageId = chunk.id;
              eventStream$.sendTextMessageStart({ messageId: currentMessageId });
            }
          }

          if (mode === "message" && content) {
            if (currentMessageId) {
              eventStream$.sendTextMessageContent({
                messageId: currentMessageId,
                content,
              });
            }
          } else if (mode === "function" && toolCall?.function?.arguments) {
            if (currentToolCallId) {
              eventStream$.sendActionExecutionArgs({
                actionExecutionId: currentToolCallId,
                args: toolCall.function.arguments,
              });
            }
          }
        }

        if (mode === "message") {
          if (currentMessageId) {
            eventStream$.sendTextMessageEnd({ messageId: currentMessageId });
          }
        } else if (mode === "function") {
          if (currentToolCallId) {
            eventStream$.sendActionExecutionEnd({ actionExecutionId: currentToolCallId });
          }
        }

        eventStream$.complete();
      });
    } catch (error) {
      throw convertServiceAdapterError(error, "DashScope");
    }

    return { threadId };
  }
}
