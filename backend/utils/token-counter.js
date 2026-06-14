/**
 * token-counter.js - 基于 tiktoken 的精确 Token 计数
 *
 * 使用 OpenAI 的 cl100k_base 编码器（GPT-3.5/GPT-4 系列）
 * 当 tiktoken 不可用时回退到估算方法
 */

'use strict';

let encoding = null;

function getEncoding() {
  if (encoding) return encoding;
  try {
    const tiktoken = require('tiktoken');
    encoding = tiktoken.get_encoding('cl100k_base');
    return encoding;
  } catch (e) {
    console.warn('[TokenCounter] tiktoken 加载失败，使用估算模式:', e.message);
    return null;
  }
}

/**
 * 计算消息列表的 Token 数（兼容 OpenAI 消息格式）
 * @param {Array<{role: string, content: string}>} messages
 * @returns {number}
 */
function countMessageTokens(messages) {
  const enc = getEncoding();
  if (!enc) return estimateTokens(messages);

  let total = 0;
  for (const msg of messages) {
    // 每条消息的基础开销：role 约 4 tokens
    total += 4;
    if (typeof msg.content === 'string') {
      total += enc.encode(msg.content).length;
    } else if (Array.isArray(msg.content)) {
      // 多模态消息
      for (const part of msg.content) {
        if (part.type === 'text') {
          total += enc.encode(part.text).length;
        }
      }
    }
  }
  // 回复引导 token
  total += 2;
  return total;
}

/**
 * 计算纯文本的 Token 数
 * @param {string} text
 * @returns {number}
 */
function countTextTokens(text) {
  if (!text) return 0;
  const enc = getEncoding();
  if (!enc) return Math.ceil(text.length / 4);
  return enc.encode(text).length;
}

/**
 * 估算 Token 数（回退方案：平均 1 token ≈ 4 字符）
 */
function estimateTokens(messages) {
  return messages.reduce((acc, msg) => {
    const content = typeof msg.content === 'string'
      ? msg.content
      : JSON.stringify(msg.content || '');
    return acc + Math.ceil(content.length / 4);
  }, 0);
}

module.exports = { countMessageTokens, countTextTokens, estimateTokens };
