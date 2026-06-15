/**
 * 流式代理服务
 * 
 * 功能特性：
 * - 统一的流式响应处理
 * - 支持真实SSE和伪流式降级
 * - 增量Token计数和费用计算
 * - 实时错误处理和降级
 */

const { v4: uuidv4 } = require('uuid');
const { countMessageTokens, countTextTokens } = require('../utils/token-counter');

class StreamingProxy {
  constructor() {
    this.activeStreams = new Map();
  }

  async stream(req, res, vendorAdapter, modelMapping, messages, requestBody, inputTokens) {
    const streamId = uuidv4();
    const startTime = Date.now();
    
    this.activeStreams.set(streamId, {
      status: 'active',
      startTime,
      model: modelMapping.alias,
      vendor: modelMapping.adapter_key,
    });

    return new Promise((resolve, reject) => {
      let outputContent = '';
      let outputTokens = 0;

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      res.write(`data: ${JSON.stringify({
        id: streamId,
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: modelMapping.alias,
        _vendor: modelMapping.adapter_key,
        _meta: { input_tokens: inputTokens, status: 'streaming' },
      })}\n\n`);

      const onChunk = (chunk) => {
        if (!chunk || typeof chunk !== 'object') return;
        
        if (chunk.choices && chunk.choices[0]) {
          const delta = chunk.choices[0].delta;
          
          if (delta && delta.content) {
            outputContent += delta.content;
            outputTokens = countTextTokens(outputContent);
            
            res.write(`data: ${JSON.stringify({
              id: streamId,
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: modelMapping.alias,
              choices: [{ delta, finish_reason: null }],
              _meta: {
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                cost: this.calculateCost(inputTokens, outputTokens, modelMapping),
              },
            })}\n\n`);
          } else if (chunk.choices[0].finish_reason) {
            res.write(`data: ${JSON.stringify({
              id: streamId,
              object: 'chat.completion.chunk',
              created: Date.now(),
              model: modelMapping.alias,
              choices: [{ delta: {}, finish_reason: chunk.choices[0].finish_reason }],
              _meta: {
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                cost: this.calculateCost(inputTokens, outputTokens, modelMapping),
                latency_ms: Date.now() - startTime,
              },
            })}\n\n`);
            
            res.write('data: [DONE]\n\n');
            res.end();

            this.activeStreams.set(streamId, {
              status: 'completed',
              startTime,
              endTime: Date.now(),
              model: modelMapping.alias,
              vendor: modelMapping.adapter_key,
              inputTokens,
              outputTokens,
              cost: this.calculateCost(inputTokens, outputTokens, modelMapping),
            });

            resolve({
              content: outputContent,
              inputTokens,
              outputTokens,
              cost: this.calculateCost(inputTokens, outputTokens, modelMapping),
              latency_ms: Date.now() - startTime,
              vendor: modelMapping.adapter_key,
            });
          }
        }
      };

      const onError = (error) => {
        console.error(`[流式代理] 流 ${streamId} 出错:`, error.message);
        
        res.write(`data: ${JSON.stringify({
          id: streamId,
          object: 'chat.completion.chunk',
          created: Date.now(),
          model: modelMapping.alias,
          choices: [],
          error: { message: error.message, code: 'STREAM_ERROR' },
          _meta: { input_tokens: inputTokens, output_tokens: outputTokens, status: 'error' },
        })}\n\n`);
        
        res.write('data: [DONE]\n\n');
        res.end();

        this.activeStreams.set(streamId, {
          status: 'error',
          startTime,
          endTime: Date.now(),
          model: modelMapping.alias,
          vendor: modelMapping.adapter_key,
          error: error.message,
        });

        reject(error);
      };

      if (typeof vendorAdapter.streamCompletion === 'function') {
        vendorAdapter.streamCompletion(modelMapping, messages, requestBody, onChunk)
          .catch(onError);
      } else {
        this.pseudoStream(res, modelMapping, messages, requestBody, inputTokens, onChunk)
          .then(() => {
            res.write('data: [DONE]\n\n');
            res.end();
            resolve({
              content: outputContent,
              inputTokens,
              outputTokens,
              cost: this.calculateCost(inputTokens, outputTokens, modelMapping),
              latency_ms: Date.now() - startTime,
              vendor: modelMapping.adapter_key,
            });
          })
          .catch(onError);
      }
    });
  }

  async pseudoStream(res, modelMapping, messages, requestBody, inputTokens, onChunk) {
    const vendorAdapters = require('../adapters/vendor-adapters');
    const vendorAdapter = vendorAdapters[modelMapping.adapter_key];
    
    if (!vendorAdapter || typeof vendorAdapter.chatCompletion !== 'function') {
      throw new Error('厂商适配器不支持调用');
    }

    const response = await vendorAdapter.chatCompletion(modelMapping, messages, requestBody);
    const content = response.choices?.[0]?.message?.content || '';

    const segments = content.match(/[\s\S]{1,30}/g) || content.split('');
    
    for (let i = 0; i < segments.length; i++) {
      onChunk({
        id: uuidv4(),
        object: 'chat.completion.chunk',
        created: Date.now(),
        model: modelMapping.alias,
        choices: [{ delta: { content: segments[i] }, finish_reason: null }],
      });
      await new Promise(r => setTimeout(r, 50));
    }

    onChunk({
      id: uuidv4(),
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: modelMapping.alias,
      choices: [{ delta: {}, finish_reason: 'stop' }],
    });
  }

  calculateCost(inputTokens, outputTokens, modelMapping) {
    const inputPrice = modelMapping.input_price || 0;
    const outputPrice = modelMapping.output_price || 0;
    return (inputTokens * inputPrice + outputTokens * outputPrice) / 1000;
  }

  getActiveStreams() {
    return Array.from(this.activeStreams.entries())
      .filter(([, stream]) => stream.status === 'active')
      .map(([id, stream]) => ({ id, ...stream }));
  }

  getStats() {
    const stats = { active: 0, completed: 0, errored: 0, totalCost: 0 };
    this.activeStreams.forEach((stream) => {
      stats[stream.status] = (stats[stream.status] || 0) + 1;
      if (stream.cost) stats.totalCost += stream.cost;
    });
    return stats;
  }
}

module.exports = new StreamingProxy();
