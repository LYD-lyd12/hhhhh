import { useState, useEffect } from 'react'
import { Copy, Check, Terminal, ChevronDown, ChevronUp, Key } from 'lucide-react'
import { apiExamples } from '@/fixtures/api-examples'
import { api } from '@/lib/api'

export default function APIDocs() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedExample, setExpandedExample] = useState<string | null>(null)
  const [userApiKey, setUserApiKey] = useState('')

  useEffect(() => {
    // 获取用户的 API Key 用于文档示例
    api.apiKeys.list().then(res => {
      if (res.data && res.data.length > 0) {
        setUserApiKey(res.data[0].key)
      }
    }).catch(() => {})
  }, [])

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">API文档</h1>
          <p className="text-slate-500 mt-1">使用统一API接入各厂商AI模型</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">v1</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h2 className="text-xl font-semibold mb-2">快速开始</h2>
        <p className="text-primary-100 mb-4">使用您的API Key调用任意支持的模型</p>
        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
{`curl -X POST http://localhost:8080/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${userApiKey || 'YOUR_API_KEY'}" \\
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24">
            <h3 className="font-semibold text-slate-800 mb-4">接口列表</h3>
            <ul className="space-y-2">
              {apiExamples.map(example => (
                <li key={example.id}>
                  <button
                    onClick={() => setExpandedExample(expandedExample === example.id ? null : example.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      expandedExample === example.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      example.method === 'POST' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {example.method}
                    </span>
                    <span className="flex-1 truncate">{example.endpoint}</span>
                    {expandedExample === example.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {apiExamples.map(example => (
            <div
              key={example.id}
              className={`bg-white rounded-xl border border-slate-200 overflow-hidden transition-all ${
                expandedExample === example.id ? '' : 'hidden lg:block'
              }`}
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    example.method === 'POST' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {example.method}
                  </span>
                  <h3 className="font-semibold text-slate-800">{example.endpoint}</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(example.endpoint, `endpoint-${example.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {copiedId === `endpoint-${example.id}` ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copiedId === `endpoint-${example.id}` ? '已复制' : '复制'}
                </button>
              </div>

              <div className="p-4">
                <p className="text-slate-600 mb-4">{example.description}</p>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">请求示例</h4>
                    <div className="relative">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-t-lg">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-400">JSON</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(example.requestBody, null, 2), `body-${example.id}`)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedId === `body-${example.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <pre className="bg-slate-900 text-slate-300 p-4 rounded-b-lg text-sm overflow-x-auto">
                        {JSON.stringify(example.requestBody, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">响应示例</h4>
                    <pre className="bg-slate-50 text-slate-700 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "id": "chatcmpl-xxxxxxxx",
  "object": "chat.completion",
  "created": 1677664795,
  "model": "${example.requestBody.model}",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">参数说明</h4>
                    <div className="bg-slate-50 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white">
                            <th className="text-left py-2 px-4 text-slate-500 font-medium">参数</th>
                            <th className="text-left py-2 px-4 text-slate-500 font-medium">类型</th>
                            <th className="text-left py-2 px-4 text-slate-500 font-medium">必填</th>
                            <th className="text-left py-2 px-4 text-slate-500 font-medium">说明</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-slate-200">
                            <td className="py-2 px-4 font-medium text-slate-800">model</td>
                            <td className="py-2 px-4 text-slate-600">string</td>
                            <td className="py-2 px-4 text-slate-600">是</td>
                            <td className="py-2 px-4 text-slate-600">模型名称或别名</td>
                          </tr>
                          <tr className="border-t border-slate-200">
                            <td className="py-2 px-4 font-medium text-slate-800">messages</td>
                            <td className="py-2 px-4 text-slate-600">array</td>
                            <td className="py-2 px-4 text-slate-600">是</td>
                            <td className="py-2 px-4 text-slate-600">对话消息列表</td>
                          </tr>
                          <tr className="border-t border-slate-200">
                            <td className="py-2 px-4 font-medium text-slate-800">max_tokens</td>
                            <td className="py-2 px-4 text-slate-600">integer</td>
                            <td className="py-2 px-4 text-slate-600">否</td>
                            <td className="py-2 px-4 text-slate-600">最大生成Token数</td>
                          </tr>
                          <tr className="border-t border-slate-200">
                            <td className="py-2 px-4 font-medium text-slate-800">stream</td>
                            <td className="py-2 px-4 text-slate-600">boolean</td>
                            <td className="py-2 px-4 text-slate-600">否</td>
                            <td className="py-2 px-4 text-slate-600">是否流式响应</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
