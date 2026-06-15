const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const freeAdapters = require('./free-adapters');

const volcengineAdapter = {
  async chatCompletion(modelMapping, messages, requestBody) {
    try {
      const response = await axios.post(
        `${modelMapping.api_base_url}/chat/completions`,
        {
          model: modelMapping.vendor_model_id,
          messages,
          temperature: requestBody.temperature || 0.7,
          max_tokens: requestBody.max_tokens || 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${modelMapping.api_key}`
          },
          timeout: 60000
        }
      );
      return response.data;
    } catch (error) {
      console.error('VolcEngine API error:', error.message);
      throw error;
    }
  }
};

const zhipuAdapter = {
  async chatCompletion(modelMapping, messages, requestBody) {
    try {
      const response = await axios.post(
        `${modelMapping.api_base_url}/chat/completions`,
        {
          model: modelMapping.vendor_model_id,
          messages,
          temperature: requestBody.temperature || 0.7,
          max_tokens: requestBody.max_tokens || 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${modelMapping.api_key}`
          },
          timeout: 60000
        }
      );
      return response.data;
    } catch (error) {
      console.error('Zhipu API error:', error.message);
      throw error;
    }
  }
};

const minimaxAdapter = {
  async chatCompletion(modelMapping, messages, requestBody) {
    try {
      const response = await axios.post(
        `${modelMapping.api_base_url}/v1/chat/completions`,
        {
          model: modelMapping.vendor_model_id,
          messages,
          temperature: requestBody.temperature || 0.7,
          max_tokens: requestBody.max_tokens || 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${modelMapping.api_key}`
          },
          timeout: 60000
        }
      );
      return response.data;
    } catch (error) {
      console.error('MiniMax API error:', error.message);
      throw error;
    }
  }
};

const alibabaAdapter = {
  async chatCompletion(modelMapping, messages, requestBody) {
    try {
      const response = await axios.post(
        `${modelMapping.api_base_url}/api/text/generation`,
        {
          model: modelMapping.vendor_model_id,
          prompt: messages.map(m => m.content).join('\n'),
          temperature: requestBody.temperature || 0.7,
          max_tokens: requestBody.max_tokens || 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${modelMapping.api_key}`
          },
          timeout: 60000
        }
      );
      return {
        id: uuidv4(),
        object: 'chat.completion',
        created: Date.now(),
        model: modelMapping.vendor_model_id,
        choices: [{
          message: {
            role: 'assistant',
            content: response.data.result || response.data.text
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      console.error('Alibaba API error:', error.message);
      throw error;
    }
  }
};

// DeepSeek 适配器 — 完全兼容 OpenAI 协议
// 文档: https://platform.deepseek.com/api-docs
// 端点: POST https://api.deepseek.com/chat/completions
const deepseekAdapter = {
  async chatCompletion(modelMapping, messages, requestBody) {
    try {
      const response = await axios.post(
        `${modelMapping.api_base_url}/chat/completions`,
        {
          model: modelMapping.vendor_model_id,
          messages,
          temperature: requestBody.temperature || 0.7,
          max_tokens: requestBody.max_tokens || 2000,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${modelMapping.api_key}`
          },
          timeout: 120000,
        }
      );
      return response.data;
    } catch (error) {
      console.error('DeepSeek API error:', error.message);
      throw error;
    }
  },

  // SSE 流式调用（支持真实流式输出）
  // 返回 { fullContent, usage } 供上层流后精准计费
  async streamCompletion(modelMapping, messages, requestBody, onChunk) {
    const response = await axios.post(
      `${modelMapping.api_base_url}/chat/completions`,
      {
        model: modelMapping.vendor_model_id,
        messages,
        temperature: requestBody.temperature || 0.7,
        max_tokens: requestBody.max_tokens || 2000,
        stream: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${modelMapping.api_key}`
        },
        timeout: 180000,
        responseType: 'stream',
      }
    );

    return new Promise((resolve, reject) => {
      let buffer = '';
      let fullContent = '';
      let finalUsage = null;
      response.data.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              // 累积 delta 内容，用于流后 Token 计数
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) fullContent += delta;
              // 捕获最后一个 chunk 中的 usage（厂商返回的真实 Token 数）
              if (parsed.usage) finalUsage = parsed.usage;
              onChunk(parsed);
            } catch {
              // 忽略无法解析的行
            }
          }
        }
      });
      response.data.on('end', () => resolve({ fullContent, usage: finalUsage }));
      response.data.on('error', reject);
    });
  }
};

module.exports = {
  // 付费厂商适配器（需配置 API Key）
  volcengine: volcengineAdapter,
  zhipu: zhipuAdapter,
  minimax: minimaxAdapter,
  alibaba: alibabaAdapter,
  deepseek: deepseekAdapter,
  // 免费适配器（无需 API Key）
  pollinations: freeAdapters.pollinations,
  ollama: freeAdapters.ollama,
};
