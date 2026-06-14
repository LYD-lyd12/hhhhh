'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, Bot, User, RefreshCw, ChevronDown, Layers } from 'lucide-react'
import { api } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  loading?: boolean
}

interface ModelOption {
  alias: string
  vendor_name: string
  input_price: number
  output_price: number
  status: string
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '您好！欢迎来到翼站Token超市。请选择模型后开始对话。',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<ModelOption[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('gpt-3.5-turbo')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // 加载可用模型列表
  useEffect(() => {
    api.models.list().then(res => {
      if (res.data && Array.isArray(res.data)) {
        const available = res.data.filter((m: ModelOption) => m.status === 'available')
        setModels(available)
        if (available.length > 0 && !available.find((m: ModelOption) => m.alias === selectedModel)) {
          setSelectedModel(available[0].alias)
        }
      }
    }).catch(() => {
      // 模型列表加载失败时保留默认值
    })
  }, [])

  // 点击外部关闭模型选择器
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false)
      }
    }
    if (showModelPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModelPicker])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    }

    setMessages(prev => [...prev, loadingMessage])

    try {
      const apiMessages = messages
        .filter(m => !m.loading) // 排除加载态消息
        .map(m => ({ role: m.role, content: m.content }))
        .concat({ role: 'user' as const, content: inputValue.trim() })

      const response = await api.models.chat(selectedModel, apiMessages)
      
      // 提取响应内容（兼容不同格式）
      let content = ''
      if (response.choices?.[0]?.message?.content) {
        content = response.choices[0].message.content
      } else if (response.message) {
        content = response.message
      } else if (response.error) {
        content = `调用失败：${response.error}`
      } else {
        content = '抱歉，收到了无法识别的响应格式。'
      }

      const responseMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content,
        timestamp: new Date()
      }

      setMessages(prev => prev.map(msg => 
        msg.loading ? responseMessage : msg
      ))
    } catch (error) {
      console.error('API call failed:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '抱歉，API 调用失败，请检查网络连接或稍后重试。',
        timestamp: new Date()
      }
      setMessages(prev => prev.map(msg => 
        msg.loading ? errorMessage : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const currentModelInfo = models.find(m => m.alias === selectedModel)
  const groupedModels = models.reduce<Record<string, ModelOption[]>>((acc, m) => {
    const vendor = m.vendor_name || '未知厂商'
    if (!acc[vendor]) acc[vendor] = []
    acc[vendor].push(m)
    return acc
  }, {})

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden" data-testid="chat-panel">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">智能助手</h2>
            <p className="text-sm text-primary-200">翼站Token超市 客服</p>
          </div>
        </div>

        {/* 模型选择器 */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            data-testid="chat-model-selector"
            className="flex items-center gap-2 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-sm transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span className="max-w-[120px] truncate">{currentModelInfo?.alias || selectedModel}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
          </button>

          {showModelPicker && (
            <div
              data-testid="chat-model-dropdown"
              className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-50"
            >
              <div className="p-2">
                {Object.entries(groupedModels).map(([vendor, vendorModels]) => (
                  <div key={vendor}>
                    <div className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {vendor}
                    </div>
                    {vendorModels.map(m => (
                      <button
                        key={m.alias}
                        onClick={() => {
                          setSelectedModel(m.alias)
                          setShowModelPicker(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedModel === m.alias
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{m.alias}</span>
                          <span className="text-xs text-slate-400">
                            ¥{m.input_price}/1K in
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
                {models.length === 0 && (
                  <div className="px-3 py-4 text-sm text-slate-400 text-center">
                    加载模型列表中...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            data-testid={`chat-message-${message.role}`}
          >
            <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${
              message.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-xl ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 text-slate-800 rounded-tl-sm'
              }`}>
                {message.loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>正在思考...</span>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 px-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentModelInfo ? `向 ${currentModelInfo.alias} 提问...` : '输入您的问题...'}
              rows={2}
              data-testid="chat-input"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            data-testid="chat-send"
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">发送</span>
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          按 Enter 发送，Shift + Enter 换行
          {currentModelInfo && (
            <span className="ml-2">当前模型：{currentModelInfo.alias}（{currentModelInfo.vendor_name}）</span>
          )}
        </p>
      </div>
    </div>
  )
}
