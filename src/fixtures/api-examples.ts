export interface APIExample {
  id: string
  name: string
  endpoint: string
  method: string
  description: string
  requestBody: Record<string, unknown>
}

export const apiExamples: APIExample[] = [
  {
    id: '1',
    name: 'Chat Completions',
    endpoint: '/v1/chat/completions',
    method: 'POST',
    description: '调用大语言模型进行对话补全',
    requestBody: {
      model: 'doubao-3.5-turbo',
      messages: [
        { role: 'system', content: '你是一个专业的AI助手' },
        { role: 'user', content: 'Hello!' }
      ],
      max_tokens: 1000,
      stream: false
    }
  },
  {
    id: '2',
    name: 'Text Completions',
    endpoint: '/v1/completions',
    method: 'POST',
    description: '文本补全接口',
    requestBody: {
      model: 'chatglm-6b',
      prompt: '今天天气真好，',
      max_tokens: 100
    }
  },
  {
    id: '3',
    name: 'Embeddings',
    endpoint: '/v1/embeddings',
    method: 'POST',
    description: '生成文本嵌入向量',
    requestBody: {
      model: 'text-embedding-ada-002',
      input: 'Hello world'
    }
  },
  {
    id: '4',
    name: 'Image Generation',
    endpoint: '/v1/images/generations',
    method: 'POST',
    description: '生成图片',
    requestBody: {
      prompt: 'A beautiful sunset over the ocean',
      n: 1,
      size: '1024x1024'
    }
  }
]
