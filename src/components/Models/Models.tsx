'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronDown, X, CheckCircle, Send, Loader2, Copy, Plus, Edit3, Trash2, AlertCircle, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

// ─── 类型定义 ──────────────────────────────────────────
interface VendorOption {
  id: string
  vendor_name: string
  adapter_key: string
}

interface ModelRecord {
  id: string
  alias: string
  vendor_id: string
  vendor_model_id: string
  input_price: number
  output_price: number
  status: string
  vendor_name: string
}

type DialogMode = 'none' | 'add' | 'edit' | 'delete'

// ─── 厂商品牌色映射 ──────────────────────────────────────
const VENDOR_STYLE: Record<string, { bg: string; text: string; short: string }> = {
  '火山引擎':        { bg: 'bg-orange-100',  text: 'text-orange-600',  short: '火' },
  '智谱AI':          { bg: 'bg-blue-100',    text: 'text-blue-600',    short: '智' },
  'MiniMax':         { bg: 'bg-green-100',   text: 'text-green-600',   short: 'M' },
  '阿里云':          { bg: 'bg-amber-100',   text: 'text-amber-600',   short: '云' },
  'DeepSeek':        { bg: 'bg-indigo-100',  text: 'text-indigo-600',  short: 'D' },
  'Pollinations.ai (免费)': { bg: 'bg-pink-100', text: 'text-pink-600', short: '🌸' },
  'Ollama (本地免费)':     { bg: 'bg-purple-100', text: 'text-purple-600', short: '🦙' },
}

const STATUS_LABEL: Record<string, string> = {
  available: '可用',
  limited: '受限',
  unavailable: '不可用',
}

const STATUS_COLOR: Record<string, string> = {
  available: 'bg-green-100 text-green-600',
  limited: 'bg-orange-100 text-orange-600',
  unavailable: 'bg-slate-100 text-slate-500',
}

export default function Models() {
  // ─── 数据状态 ────────────────────────────────
  const [models, setModels] = useState<ModelRecord[]>([])
  const [vendors, setVendors] = useState<VendorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ─── 筛选 ────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<string>('all')

  // ─── 对话框 ──────────────────────────────────
  const [dialogMode, setDialogMode] = useState<DialogMode>('none')
  const [editingModel, setEditingModel] = useState<ModelRecord | null>(null)

  // 添加/编辑表单
  const [formAlias, setFormAlias] = useState('')
  const [formVendorId, setFormVendorId] = useState('')
  const [formVendorModelId, setFormVendorModelId] = useState('')
  const [formInputPrice, setFormInputPrice] = useState('0')
  const [formOutputPrice, setFormOutputPrice] = useState('0')
  const [formStatus, setFormStatus] = useState('available')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // ─── 测试调用 ────────────────────────────────
  const [selectedModel, setSelectedModel] = useState<ModelRecord | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testLatency, setTestLatency] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  // ─── 加载数据 ────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [modelRes, vendorRes] = await Promise.all([
        api.admin.modelMappings(),
        api.admin.vendors(),
      ])
      // modelMappings 返回 { data: [...] }，vendor-configs 返回数组或 { data: [...] }
      const rawModels: any[] = (() => {
        if (Array.isArray(modelRes)) return modelRes
        if (modelRes && Array.isArray(modelRes.data)) return modelRes.data
        return []
      })()
      const rawVendors: any[] = (() => {
        if (Array.isArray(vendorRes)) return vendorRes
        if (vendorRes && Array.isArray(vendorRes.data)) return vendorRes.data
        return []
      })()
      setModels(rawModels.map((m: any) => ({
        id: m.id,
        alias: m.alias,
        vendor_id: m.vendor_id,
        vendor_model_id: m.vendor_model_id,
        input_price: Number(m.input_price) || 0,
        output_price: Number(m.output_price) || 0,
        status: m.status || 'available',
        vendor_name: m.vendor_name || '',
      })))
      setVendors(rawVendors.map((v: any) => ({
        id: v.id,
        vendor_name: v.vendor_name,
        adapter_key: v.adapter_key,
      })))
    } catch (err: any) {
      setError(err.message || '加载模型数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // ─── 分组模型（按厂商） ─────────────────────────
  const groupedModels = (() => {
    const map = new Map<string, { vendorId: string; vendorName: string; models: ModelRecord[] }>()
    for (const m of models) {
      const key = m.vendor_id
      if (!map.has(key)) {
        map.set(key, { vendorId: key, vendorName: m.vendor_name, models: [] })
      }
      map.get(key)!.models.push(m)
    }
    return Array.from(map.values()).filter(g => {
      const matchSearch = !searchTerm ||
        g.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.models.some(m => m.alias.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchVendor = selectedVendor === 'all' || g.vendorId === selectedVendor
      return matchSearch && matchVendor
    })
  })()

  // ─── 打开添加对话框 ─────────────────────────────
  const openAddDialog = () => {
    setFormAlias('')
    setFormVendorId(vendors[0]?.id || '')
    setFormVendorModelId('')
    setFormInputPrice('0')
    setFormOutputPrice('0')
    setFormStatus('available')
    setDialogMode('add')
  }

  // ─── 打开编辑对话框 ─────────────────────────────
  const openEditDialog = (model: ModelRecord) => {
    setEditingModel(model)
    setFormAlias(model.alias)
    setFormVendorId(model.vendor_id)
    setFormVendorModelId(model.vendor_model_id)
    setFormInputPrice(String(model.input_price))
    setFormOutputPrice(String(model.output_price))
    setFormStatus(model.status)
    setDialogMode('edit')
  }

  // ─── 打开删除确认 ───────────────────────────────
  const openDeleteDialog = (model: ModelRecord) => {
    setEditingModel(model)
    setDialogMode('delete')
  }

  // ─── 提交添加 ──────────────────────────────────
  const handleAdd = async () => {
    if (!formAlias.trim() || !formVendorId || !formVendorModelId.trim()) {
      showMessage('error', '别名、厂商和厂商模型ID不能为空')
      return
    }
    setFormSubmitting(true)
    try {
      const res = await api.admin.createModelMapping({
        alias: formAlias.trim(),
        vendor_id: formVendorId,
        vendor_model_id: formVendorModelId.trim(),
        input_price: Number(formInputPrice) || 0,
        output_price: Number(formOutputPrice) || 0,
        status: formStatus,
      })
      if (res.error) {
        showMessage('error', res.error)
      } else {
        showMessage('success', '模型添加成功')
        setDialogMode('none')
        loadData()
      }
    } catch (err: any) {
      showMessage('error', err.message || '添加失败')
    } finally {
      setFormSubmitting(false)
    }
  }

  // ─── 提交编辑 ──────────────────────────────────
  const handleEdit = async () => {
    if (!editingModel) return
    setFormSubmitting(true)
    try {
      const res = await api.admin.updateModelMapping(editingModel.id, {
        input_price: Number(formInputPrice) || 0,
        output_price: Number(formOutputPrice) || 0,
        status: formStatus,
      })
      if (res.error) {
        showMessage('error', res.error)
      } else {
        showMessage('success', '模型信息已更新')
        setDialogMode('none')
        loadData()
      }
    } catch (err: any) {
      showMessage('error', err.message || '更新失败')
    } finally {
      setFormSubmitting(false)
    }
  }

  // ─── 提交删除 ──────────────────────────────────
  const handleDelete = async () => {
    if (!editingModel) return
    setFormSubmitting(true)
    try {
      const res = await api.admin.deleteModelMapping(editingModel.id)
      if (res.error) {
        showMessage('error', res.error)
      } else {
        showMessage('success', `模型 "${editingModel.alias}" 已删除`)
        setDialogMode('none')
        loadData()
      }
    } catch (err: any) {
      showMessage('error', err.message || '删除失败')
    } finally {
      setFormSubmitting(false)
    }
  }

  // ─── 测试调用 ──────────────────────────────────
  const handleTestCall = async () => {
    if (!selectedModel || isTesting) return
    setIsTesting(true)
    setTestResult(null)
    setTestLatency('')
    const startTime = Date.now()
    try {
      const response = await api.models.chat(selectedModel.alias, [
        { role: 'user', content: '你好，请用一句话介绍自己' }
      ])
      const elapsed = Date.now() - startTime
      setTestLatency(`${elapsed}ms`)
      
      if (response.error) {
        const data = response
        const errorType = data.code === 'API_KEY_MISSING' ? 'API Key 未配置' :
          data.code === 'ADAPTER_ERROR' ? '适配器调用失败' :
          data.code === 'VENDOR_ERROR' ? '厂商调用失败' : '请求失败'
        setTestResult(`❌ ${errorType}${data.vendor ? ` [${data.vendor}]` : ''}: ${data.error || '未知错误'}`)
        return
      }
      const isReal = response._real === true
      const isFallback = response._fallback === true
      const vendorName = response._vendor || ''
      const latency = response._latency_ms ? `${response._latency_ms}ms` : ''
      const fallbackError = response._error || ''
      const content = response.choices?.[0]?.message?.content || response.message || response.content || '无返回内容'
      let result = content
      if (isReal) {
        result += `\n\n---\n✅ 真实调用 · ${vendorName}${latency ? ' · 耗时 ' + latency : ''}`
        if (response.usage) {
          result += `\nTokens: 输入${response.usage.prompt_tokens || 0} + 输出${response.usage.completion_tokens || 0} = 总计${response.usage.total_tokens || 0}`
        }
      } else if (isFallback) {
        result += `\n\n---\n⚠️ 降级 Mock · ${vendorName}（真实调用失败: ${fallbackError}）`
      } else {
        result += `\n\n---\n⚠️ 模拟响应（后端 Mock）`
      }
      setTestResult(result)
    } catch (err) {
      const elapsed = Date.now() - startTime
      setTestLatency(`${elapsed}ms`)
      setTestResult('❌ 后端服务未启动，请先在 backend 目录下运行 node server.js')
    } finally {
      setIsTesting(false)
    }
  }

  const isTestError = testResult?.startsWith('❌')
  const vendorList = Array.from(new Set(models.map(m => m.vendor_id)))

  // ─── 计算统计 ──────────────────────────────────
  const availableCount = models.filter(m => m.status === 'available').length
  const vendorCount = new Set(models.map(m => m.vendor_id)).size

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">模型市场</h1>
          <p className="text-slate-500 mt-1">
            管理模型映射与定价 · {models.length} 个模型 · {vendorCount} 个厂商 · {availableCount} 个可用
          </p>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <button onClick={loadData} className="px-3 py-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />重试
            </button>
          )}
          <button
            onClick={openAddDialog}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加模型
          </button>
        </div>
      </div>

      {/* 提示消息 */}
      {message && (
        <div className={`px-4 py-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* 错误横幅 */}
      {error && !loading && (
        <div className="px-4 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          加载模型数据失败: {error}
        </div>
      )}

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索模型别名或厂商..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="relative">
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="all">全部厂商</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.vendor_name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 加载中 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-2 text-slate-500">加载模型数据...</span>
        </div>
      )}

      {/* 模型列表（按厂商分组） */}
      {!loading && groupedModels.map(group => {
        const style = VENDOR_STYLE[group.vendorName] || { bg: 'bg-slate-100', text: 'text-slate-600', short: group.vendorName.charAt(0) }
        return (
          <div key={group.vendorId} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* 厂商头部 */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${style.bg} rounded-lg flex items-center justify-center`}>
                  <span className={`text-xl font-bold ${style.text}`}>{style.short}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800">{group.vendorName}</h3>
                  <p className="text-sm text-slate-500">{group.models.length} 个模型</p>
                </div>
              </div>
            </div>

            {/* 模型卡片网格 */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.models.map(model => (
                <div
                  key={model.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    selectedModel?.id === model.id ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* 标题 + 操作按钮 */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedModel(model)}>
                      <h4 className="font-medium text-slate-800 truncate">{model.alias}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{model.vendor_model_id}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded ml-2 shrink-0 ${STATUS_COLOR[model.status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABEL[model.status] || model.status}
                    </span>
                  </div>

                  {/* 定价信息 */}
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center gap-1 text-slate-500">
                      <span>入: ¥{model.input_price}/K tokens</span>
                    </div>
                    {model.output_price > 0 && (
                      <div className="text-slate-500">
                        出: ¥{model.output_price}/K tokens
                      </div>
                    )}
                    {model.input_price === 0 && model.output_price === 0 && (
                      <span className="text-xs text-green-500 font-medium">免费</span>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openEditDialog(model)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      编辑定价
                    </button>
                    <button
                      onClick={() => openDeleteDialog(model)}
                      className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* 空状态 */}
      {!loading && groupedModels.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">暂无模型数据</p>
          <p className="text-sm mt-1">点击"添加模型"创建第一个模型映射</p>
        </div>
      )}

      {/* ─── 测试调用弹窗 ─────────────────────────── */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">{selectedModel.alias}</h2>
                <p className="text-sm text-slate-500">{selectedModel.vendor_name} · {selectedModel.vendor_model_id}</p>
              </div>
              <button onClick={() => setSelectedModel(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 状态 */}
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-sm rounded-full ${STATUS_COLOR[selectedModel.status]}`}>
                  {STATUS_LABEL[selectedModel.status]}
                </span>
                <button onClick={() => { setSelectedModel(null); openEditDialog(selectedModel) }} className="text-sm text-primary-600 hover:underline">
                  编辑定价 →
                </button>
              </div>

              {/* 价格信息 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-800 mb-3">价格信息</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">输入Token价格</span>
                    <span className="font-medium">¥{selectedModel.input_price}/千token</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">输出Token价格</span>
                    <span className="font-medium">¥{selectedModel.output_price}/千token</span>
                  </div>
                </div>
              </div>

              {/* API 示例 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-medium text-slate-800 mb-3">API调用示例</h3>
                <pre className="text-xs bg-slate-800 text-green-400 p-3 rounded-lg overflow-x-auto">
{`curl -X POST http://localhost:8080/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "${selectedModel.alias}",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}
                </pre>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleTestCall}
                  disabled={isTesting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />测试中...</>
                  ) : (
                    <><Send className="w-4 h-4" />测试调用</>
                  )}
                </button>
              </div>

              {/* 测试结果 */}
              {testResult && (
                <div className={`mt-4 rounded-lg p-4 border ${isTestError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`font-medium flex items-center gap-2 ${isTestError ? 'text-red-800' : 'text-green-800'}`}>
                      {isTestError ? <><X className="w-4 h-4" />调用失败</> : <><CheckCircle className="w-4 h-4" />测试调用结果</>}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">耗时 {testLatency}</span>
                      <button onClick={() => navigator.clipboard.writeText(testResult)} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1">
                        <Copy className="w-3 h-3" />复制
                      </button>
                    </div>
                  </div>
                  <p className={`text-sm whitespace-pre-wrap ${isTestError ? 'text-red-700' : 'text-green-700'}`}>{testResult}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 添加模型弹窗 ─────────────────────────── */}
      {dialogMode === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">添加模型</h2>
              <button onClick={() => setDialogMode('none')} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* 别名 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">别名 (alias) *</label>
                <input
                  type="text"
                  value={formAlias}
                  onChange={(e) => setFormAlias(e.target.value)}
                  placeholder="例如: deepseek-chat"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-slate-400 mt-1">用户在 API 中使用的模型名</p>
              </div>

              {/* 厂商选择 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">厂商 *</label>
                <select
                  value={formVendorId}
                  onChange={(e) => setFormVendorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.vendor_name}</option>
                  ))}
                </select>
              </div>

              {/* 厂商模型ID */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">厂商模型ID *</label>
                <input
                  type="text"
                  value={formVendorModelId}
                  onChange={(e) => setFormVendorModelId(e.target.value)}
                  placeholder="例如: deepseek-chat"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* 定价 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">输入价格 (元/千token)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formInputPrice}
                    onChange={(e) => setFormInputPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">输出价格 (元/千token)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formOutputPrice}
                    onChange={(e) => setFormOutputPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* 状态 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="available">可用</option>
                  <option value="limited">受限</option>
                  <option value="unavailable">不可用</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setDialogMode('none')} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />提交中...</> : '确认添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 编辑定价弹窗 ─────────────────────────── */}
      {dialogMode === 'edit' && editingModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">编辑模型</h2>
                <p className="text-sm text-slate-500">{editingModel.alias} · {editingModel.vendor_name}</p>
              </div>
              <button onClick={() => setDialogMode('none')} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* 只读信息 */}
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">别名</span><span className="font-medium">{editingModel.alias}</span></div>
                <div className="flex justify-between mt-1"><span className="text-slate-500">厂商模型ID</span><span className="font-medium">{editingModel.vendor_model_id}</span></div>
              </div>

              {/* 定价编辑 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">输入价格 (元/千token)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formInputPrice}
                    onChange={(e) => setFormInputPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">输出价格 (元/千token)</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formOutputPrice}
                    onChange={(e) => setFormOutputPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* 状态 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="available">可用</option>
                  <option value="limited">受限</option>
                  <option value="unavailable">不可用</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setDialogMode('none'); openDeleteDialog(editingModel) }} className="px-4 py-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />删除
                </button>
                <button onClick={() => setDialogMode('none')} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                  取消
                </button>
                <button
                  onClick={handleEdit}
                  disabled={formSubmitting}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />提交中...</> : '保存更改'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 删除确认弹窗 ─────────────────────────── */}
      {dialogMode === 'delete' && editingModel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">确认删除模型</h2>
            <p className="text-sm text-slate-500 mb-2">
              别名: <span className="font-medium text-slate-700">{editingModel.alias}</span>
            </p>
            <p className="text-sm text-slate-500 mb-6">
              厂商: {editingModel.vendor_name} · {editingModel.vendor_model_id}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDialogMode('none')} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={formSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />删除中...</> : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
