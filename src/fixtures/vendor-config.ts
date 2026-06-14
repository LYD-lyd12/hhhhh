export interface Vendor {
  id: string
  name: string
  logo?: string
  color: string
  bgColor: string
  textColor: string
  models: Model[]
  status: 'active' | 'inactive' | 'error'
  description: string
}

export interface Model {
  id: string
  name: string
  alias: string
  type: 'chat' | 'completion' | 'embedding' | 'image' | 'speech'
  status: 'available' | 'limited' | 'unavailable'
  pricing: {
    input: number
    output: number
    unit: 'token' | 'image' | 'minute'
  }
}

export const vendors: Vendor[] = [
  {
    id: 'volcengine',
    name: '火山引擎',
    color: '火',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600',
    status: 'active',
    description: '字节跳动旗下智能云服务平台',
    models: [
      { id: 'doubao-3.5-turbo', name: '豆包3.5 Turbo', alias: 'gpt-3.5-turbo', type: 'chat', status: 'available', pricing: { input: 0.0015, output: 0.002, unit: 'token' } },
      { id: 'doubao-4', name: '豆包4.0', alias: 'gpt-4', type: 'chat', status: 'available', pricing: { input: 0.006, output: 0.018, unit: 'token' } },
      { id: 'speech-to-text', name: '语音识别', alias: 'whisper-1', type: 'speech', status: 'available', pricing: { input: 0.006, output: 0, unit: 'minute' } },
      { id: 'text-to-image', name: '图像生成', alias: 'dall-e-3', type: 'image', status: 'available', pricing: { input: 0, output: 0.02, unit: 'image' } }
    ]
  },
  {
    id: 'zhipu',
    name: '智谱AI',
    color: '智',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    status: 'active',
    description: '专注于大语言模型研发',
    models: [
      { id: 'chatglm-6b', name: 'ChatGLM-6B', alias: 'chatglm-6b', type: 'chat', status: 'available', pricing: { input: 0.001, output: 0.001, unit: 'token' } },
      { id: 'chatglm-2-6b', name: 'ChatGLM2-6B', alias: 'chatglm2-6b', type: 'chat', status: 'available', pricing: { input: 0.0012, output: 0.0012, unit: 'token' } },
      { id: 'codegeex-2', name: 'CodeGeeX2', alias: 'codegeex-2', type: 'completion', status: 'available', pricing: { input: 0.0015, output: 0.0015, unit: 'token' } }
    ]
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    color: 'M',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600',
    status: 'active',
    description: 'AI基础设施服务商',
    models: [
      { id: 'abab-5-chat', name: '海螺AI', alias: 'abab-5-chat', type: 'chat', status: 'available', pricing: { input: 0.0018, output: 0.0025, unit: 'token' } },
      { id: 'speech-large', name: '语音大模型', alias: 'speech-large', type: 'speech', status: 'limited', pricing: { input: 0.008, output: 0, unit: 'minute' } },
      { id: 'video-gen', name: '视频生成', alias: 'video-gen', type: 'image', status: 'unavailable', pricing: { input: 0, output: 0.1, unit: 'image' } }
    ]
  },
  {
    id: 'alibaba',
    name: '阿里云',
    color: '云',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-600',
    status: 'active',
    description: '阿里巴巴旗下云计算平台',
    models: [
      { id: 'qwen-7b-chat', name: '通义千问7B', alias: 'qwen-7b-chat', type: 'chat', status: 'available', pricing: { input: 0.0012, output: 0.0012, unit: 'token' } },
      { id: 'qwen-14b-chat', name: '通义千问14B', alias: 'qwen-14b-chat', type: 'chat', status: 'available', pricing: { input: 0.002, output: 0.002, unit: 'token' } },
      { id: 'wanxiang', name: '通义万相', alias: 'wanxiang', type: 'image', status: 'available', pricing: { input: 0, output: 0.015, unit: 'image' } },
      { id: 'tingwu', name: '通义听悟', alias: 'tingwu', type: 'speech', status: 'available', pricing: { input: 0.005, output: 0, unit: 'minute' } }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    color: 'D',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600',
    status: 'active',
    description: '深度求索 — 极高性价比大模型',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3', alias: 'deepseek-chat', type: 'chat', status: 'available', pricing: { input: 0.001, output: 0.002, unit: 'token' } },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1', alias: 'deepseek-reasoner', type: 'chat', status: 'available', pricing: { input: 0.004, output: 0.016, unit: 'token' } },
    ]
  },
  {
    id: 'pollinations',
    name: 'Pollinations.ai',
    color: '🌸',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-600',
    status: 'active',
    description: '免费开源 AI 平台，无需 API Key',
    models: [
      { id: 'openai', name: 'GPT (免费)', alias: 'pollinations-gpt', type: 'chat', status: 'available', pricing: { input: 0, output: 0, unit: 'token' } },
      { id: 'mistral', name: 'Mistral (免费)', alias: 'pollinations-mistral', type: 'chat', status: 'available', pricing: { input: 0, output: 0, unit: 'token' } },
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama (本地)',
    color: '🦙',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600',
    status: 'active',
    description: '本地大模型运行平台，需安装 Ollama',
    models: [
      { id: 'qwen2.5:0.5b', name: 'Qwen2.5 0.5B', alias: 'ollama-qwen', type: 'chat', status: 'available', pricing: { input: 0, output: 0, unit: 'token' } },
      { id: 'llama3.2:1b', name: 'Llama3.2 1B', alias: 'ollama-llama', type: 'chat', status: 'available', pricing: { input: 0, output: 0, unit: 'token' } },
      { id: 'deepseek-r1:1.5b', name: 'DeepSeek-R1 1.5B', alias: 'ollama-deepseek', type: 'chat', status: 'available', pricing: { input: 0, output: 0, unit: 'token' } },
    ]
  }
]
