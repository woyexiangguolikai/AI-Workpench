/**
 * DeepSeek API 调用封装
 *
 * 提供类型安全的 Chat Completion API 封装，支持
 * 非流式和流式两种调用模式。
 *
 * 注意：API Key 从环境变量 DEEPSEEK_API_KEY 注入，
 * 绝不硬编码或写入项目文件。本地调用记录仅保留时间、
 * 模型、文件范围和任务类型，不记录请求/响应内容。
 */

/** DeepSeek 消息角色 */
export type MessageRole = 'system' | 'user' | 'assistant';

/** 单条消息 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** Chat completion 请求选项 */
export interface ChatOptions {
  /** 模型名称，默认 deepseek-chat */
  model?: string;
  /** 温度 0-2，默认 0.7 */
  temperature?: number;
  /** 最大输出 token 数 */
  maxTokens?: number;
  /** Top-p 采样 */
  topP?: number;
  /** 流式输出 */
  stream?: boolean;
}

/** Chat completion 响应中的 token 用量 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Chat completion 响应 */
export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  usage?: TokenUsage;
}

/** DeepSeek API 调用错误 */
export class DeepSeekError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly apiError?: unknown,
  ) {
    super(message);
    this.name = 'DeepSeekError';
  }
}

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-chat';

/**
 * DeepSeek API 客户端
 *
 * @example
 * ```ts
 * const client = new DeepSeekClient({ apiKey: 'sk-xxx' });
 * const response = await client.chat([
 *   { role: 'user', content: '你好' }
 * ]);
 * console.log(response.content);
 * ```
 */
export class DeepSeekClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; model?: string }) {
    // 仅从环境变量或构造函数参数获取 API Key，绝不硬编码
    this.apiKey = options?.apiKey ?? process.env['DEEPSEEK_API_KEY'] ?? '';
    this.baseUrl = options?.baseUrl ?? process.env['DEEPSEEK_BASE_URL'] ?? DEFAULT_BASE_URL;
    this.defaultModel = options?.model ?? DEFAULT_MODEL;
  }

  /**
   * 发送 Chat Completion 请求（非流式）。
   *
   * @param messages - 对话消息列表
   * @param options - 可选参数（覆盖构造时的默认值）
   * @returns Chat completion 响应
   * @throws {DeepSeekError} 当 API 返回错误时
   */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.apiKey) {
      throw new DeepSeekError(
        'DeepSeek API Key 未配置。请设置环境变量 DEEPSEEK_API_KEY 或通过构造函数传入。',
      );
    }

    const body = {
      model: options?.model ?? this.defaultModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      stream: false,
    };

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new DeepSeekError(
        `DeepSeek API 返回错误 (${response.status}): ${errorBody}`,
        response.status,
        errorBody,
      );
    }

    const data = (await response.json()) as {
      id: string;
      model: string;
      choices: Array<{
        message: { content: string };
        finish_reason: string;
      }>;
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    const choice = data.choices[0];
    if (!choice) {
      throw new DeepSeekError('DeepSeek API 返回空响应');
    }

    return {
      id: data.id,
      model: data.model,
      content: choice.message.content,
      finishReason: choice.finish_reason,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * 发送 Chat Completion 请求（流式）。
   *
   * 返回一个异步生成器，每次产出增量文本块。
   *
   * @param messages - 对话消息列表
   * @param options - 可选参数
   * @yields 文本增量
   */
  async *streamChat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncGenerator<string, ChatResponse, void> {
    if (!this.apiKey) {
      throw new DeepSeekError(
        'DeepSeek API Key 未配置。请设置环境变量 DEEPSEEK_API_KEY 或通过构造函数传入。',
      );
    }

    const body = {
      model: options?.model ?? this.defaultModel,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      stream: true,
    };

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new DeepSeekError(
        `DeepSeek API 返回错误 (${response.status}): ${errorBody}`,
        response.status,
        errorBody,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new DeepSeekError('DeepSeek API 返回空流');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let finishReason = 'stop';
    let modelName = options?.model ?? this.defaultModel;
    let responseId = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data) as {
              id: string;
              model: string;
              choices: Array<{
                delta: { content?: string };
                finish_reason: string | null;
              }>;
            };

            if (parsed.id) responseId = parsed.id;
            if (parsed.model) modelName = parsed.model;

            const delta = parsed.choices[0]?.delta;
            const reason = parsed.choices[0]?.finish_reason;

            if (delta?.content) {
              fullContent += delta.content;
              yield delta.content;
            }

            if (reason) {
              finishReason = reason;
            }
          } catch {
            // 忽略无法解析的行
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      id: responseId,
      model: modelName,
      content: fullContent,
      finishReason,
    };
  }
}
