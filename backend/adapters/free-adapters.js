/**
 * free-adapters.js - 免费/本地 LLM 适配器
 *
 * 包含无需 API Key 即可使用的真实大模型调用：
 * 1. Pollinations.ai - 完全免费，无需注册，OpenAI 兼容
 * 2. Ollama - 本地大模型，需用户安装 Ollama 并拉取模型
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// ============================================================
// Pollinations.ai 适配器 — 免费、无需 API Key
// 文档: https://github.com/pollinations/pollinations
// OpenAI 兼容端点: POST https://text.pollinations.ai/openai
// ============================================================
const pollinationsAdapter = {
  name: 'Pollinations.ai (Free)',

  async chatCompletion(modelMapping, messages, requestBody) {
    const model = modelMapping.vendor_model_id || 'openai';
    const payload = {
      model,
      messages,
      temperature: requestBody.temperature ?? 0.7,
      max_tokens: requestBody.max_tokens ?? 2000,
      stream: false,
    };

    const startTime = Date.now();
    try {
      const response = await axios.post(
        'https://text.pollinations.ai/openai',
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 90000,
        }
      );

      const data = response.data;

      // 标准化为 OpenAI 格式响应
      const normalized = {
        id: data.id || `pollinations-${uuidv4().slice(0, 8)}`,
        object: 'chat.completion',
        created: data.created || Math.floor(Date.now() / 1000),
        model: data.model || model,
        choices: (data.choices || []).map((c) => ({
          index: c.index || 0,
          message: {
            role: 'assistant',
            content: c.message?.content || c.text || '',
          },
          finish_reason: c.finish_reason || 'stop',
        })),
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || estimateTokens(messages),
          completion_tokens:
            data.usage?.completion_tokens ||
            estimateTokens([
              {
                role: 'assistant',
                content:
                  data.choices?.[0]?.message?.content ||
                  data.choices?.[0]?.text ||
                  '',
              },
            ]),
          total_tokens:
            data.usage?.total_tokens ||
            estimateTokens(messages) +
              estimateTokens([
                {
                  role: 'assistant',
                  content:
                    data.choices?.[0]?.message?.content ||
                    data.choices?.[0]?.text ||
                    '',
                },
              ]),
        },
        _meta: {
          adapter: 'pollinations',
          latency_ms: Date.now() - startTime,
        },
      };

      return normalized;
    } catch (error) {
      const errMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.detail ||
        error.message;
      console.error('[Pollinations] API 调用失败:', errMsg);
      throw new Error(`Pollinations API 错误: ${errMsg}`);
    }
  },

  /** SSE 流式调用 */
  async streamCompletion(modelMapping, messages, requestBody, onChunk) {
    const model = modelMapping.vendor_model_id || 'openai';
    const response = await axios.post(
      'https://text.pollinations.ai/openai',
      {
        model,
        messages,
        temperature: requestBody.temperature ?? 0.7,
        max_tokens: requestBody.max_tokens ?? 2000,
        stream: true,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000,
        responseType: 'stream',
      }
    );

    return new Promise((resolve, reject) => {
      let buffer = '';
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try { onChunk(JSON.parse(data)); } catch { /* skip */ }
          }
        }
      });
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });
  },
};

// ============================================================
// Ollama 适配器 — 本地免费大模型
// 需要用户安装 Ollama: https://ollama.com
// OpenAI 兼容端点: POST http://localhost:11434/v1/chat/completions
// ============================================================
const ollamaAdapter = {
  name: 'Ollama (Local)',

  async chatCompletion(modelMapping, messages, requestBody) {
    const model = modelMapping.vendor_model_id || 'qwen2.5:0.5b';
    const payload = {
      model,
      messages,
      temperature: requestBody.temperature ?? 0.7,
      max_tokens: requestBody.max_tokens ?? 2000,
      stream: false,
    };

    const ollamaBaseUrl =
      process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const startTime = Date.now();

    try {
      const response = await axios.post(
        `${ollamaBaseUrl}/v1/chat/completions`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000,
        }
      );

      const data = response.data;
      const content = data.choices?.[0]?.message?.content || '';

      const normalized = {
        id: data.id || `ollama-${uuidv4().slice(0, 8)}`,
        object: 'chat.completion',
        created: data.created || Math.floor(Date.now() / 1000),
        model: data.model || model,
        choices: (data.choices || []).map((c) => ({
          index: c.index || 0,
          message: {
            role: 'assistant',
            content: c.message?.content || c.text || '',
          },
          finish_reason: c.finish_reason || 'stop',
        })),
        usage: {
          prompt_tokens: data.usage?.prompt_tokens || estimateTokens(messages),
          completion_tokens:
            data.usage?.completion_tokens ||
            estimateTokens([{ role: 'assistant', content }]),
          total_tokens:
            data.usage?.total_tokens ||
            estimateTokens(messages) + estimateTokens([{ role: 'assistant', content }]),
        },
        _meta: {
          adapter: 'ollama',
          latency_ms: Date.now() - startTime,
        },
      };

      return normalized;
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        throw new Error(
          'Ollama 服务未运行。请先安装 Ollama (https://ollama.com)，然后运行 `ollama serve` 并拉取模型'
        );
      }
      const errMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.detail ||
        error.message;
      console.error('[Ollama] API 调用失败:', errMsg);
      throw new Error(`Ollama API 错误: ${errMsg}`);
    }
  },

  /** SSE 流式调用 */
  async streamCompletion(modelMapping, messages, requestBody, onChunk) {
    const model = modelMapping.vendor_model_id || 'qwen2.5:0.5b';
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await axios.post(
      `${ollamaBaseUrl}/v1/chat/completions`,
      {
        model,
        messages,
        temperature: requestBody.temperature ?? 0.7,
        max_tokens: requestBody.max_tokens ?? 2000,
        stream: true,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 180000,
        responseType: 'stream',
      }
    );

    return new Promise((resolve, reject) => {
      let buffer = '';
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try { onChunk(JSON.parse(data)); } catch { /* skip */ }
          }
        }
      });
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });
  },
};

// ============================================================
// 工具函数
// ============================================================
function estimateTokens(messages) {
  if (!Array.isArray(messages)) return 0;
  return messages.reduce(
    (acc, msg) => acc + Math.ceil((msg.content?.length || 0) / 4),
    0
  );
}

module.exports = {
  pollinations: pollinationsAdapter,
  ollama: ollamaAdapter,
};
