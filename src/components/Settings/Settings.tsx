'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, X, Key, Globe, Power, PowerOff, Server, Eye, EyeOff, Shield, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

interface VendorConfig {
  id: string
  vendor_name: string
  adapter_key: string
  api_base_url: string
  api_key: string
  api_secret: string
  status: string
  created_at: string
  updated_at: string
}

// 厂商适配器描述信息（用于卡片展示）
const VENDOR_META: Record<string, { color: string; icon: string; desc: string }> = {
  volcengine: { color: 'bg-blue-500', icon: '火山引擎', desc: '豆包大模型、语音、图像' },
  zhipu: { color: 'bg-purple-500', icon: '智谱AI', desc: 'ChatGLM、CodeGeeX' },
  minimax: { color: 'bg-orange-500', icon: 'MiniMAX', desc: '海螺AI、语音、视频' },
  alibaba: { color: 'bg-red-500', icon: '阿里云', desc: '通义千问、通义万相' },
  deepseek: { color: 'bg-indigo-500', icon: 'DeepSeek', desc: 'DeepSeek V3 / R1 推理' },
  pollinations: { color: 'bg-pink-500', icon: 'Pollinations.ai', desc: '免费模型，无需 API Key' },
  ollama: { color: 'bg-cyan-500', icon: 'Ollama', desc: '本地部署，无需 API Key' },
}

// 不需要 API Key 的免费/本地厂商
const FREE_VENDORS = ['pollinations', 'ollama']

export default function Settings() {
  const [vendors, setVendors] = useState<VendorConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  // 编辑态（打开编辑弹窗时，copy 当前厂商数据到这儿）
  const [editingVendor, setEditingVendor] = useState<VendorConfig | null>(null)
  const [editApiKey, setEditApiKey] = useState('')
  const [editApiSecret, setEditApiSecret] = useState('')
  const [editBaseUrl, setEditBaseUrl] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchVendors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.vendors()
      if (res.data && Array.isArray(res.data)) {
        setVendors(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch vendors:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  // ─── 打开编辑弹窗 ────────────────────────────────────
  const openEdit = (vendor: VendorConfig) => {
    setEditingVendor(vendor)
    setEditApiKey(vendor.api_key || '')
    setEditApiSecret(vendor.api_secret || '')
    setEditBaseUrl(vendor.api_base_url || '')
    setEditStatus(vendor.status || 'active')
    setShowKey(false)
    setEditError('')
  }

  const closeEdit = () => {
    setEditingVendor(null)
    setEditError('')
  }

  // ─── 保存厂商配置 ────────────────────────────────────
  const handleSave = async () => {
    if (!editingVendor) return
    setEditError('')

    // 免费厂商只允许修改 base_url 和 status
    const isFree = FREE_VENDORS.includes(editingVendor.adapter_key)

    setSavingId(editingVendor.id)
    try {
      const data: any = {
        api_key: isFree ? (editingVendor.api_key || '') : editApiKey,
        api_secret: isFree ? (editingVendor.api_secret || '') : editApiSecret,
        api_base_url: editBaseUrl,
        status: editStatus,
      }
      const res = await api.admin.updateVendor(editingVendor.id, data)
      if (res.error) {
        setEditError(res.error)
      } else {
        closeEdit()
        await fetchVendors()
      }
    } catch (err) {
      setEditError('保存失败，请检查网络连接')
    } finally {
      setSavingId(null)
    }
  }

  // ─── 快速切换厂商启用/停用 ──────────────────────────
  const toggleStatus = async (vendor: VendorConfig) => {
    const newStatus = vendor.status === 'active' ? 'inactive' : 'active'
    setSavingId(vendor.id)
    try {
      await api.admin.updateVendor(vendor.id, { status: newStatus })
      await fetchVendors()
    } catch (err) {
      console.error('Toggle status failed:', err)
    } finally {
      setSavingId(null)
    }
  }

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">厂商 API Key 管理</h1>
          <p className="text-slate-500 mt-1">配置各 AI 厂商的 API Key 与连接参数</p>
        </div>
        <button
          onClick={fetchVendors}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vendors.map(vendor => {
          const meta = VENDOR_META[vendor.adapter_key]
          const isFree = FREE_VENDORS.includes(vendor.adapter_key)
          const hasKey = vendor.api_key && vendor.api_key.trim().length > 0
          const isActive = vendor.status === 'active'

          return (
            <div
              key={vendor.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                isActive ? 'border-slate-200' : 'border-slate-100 opacity-70'
              }`}
            >
              {/* Vendor Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${meta?.color || 'bg-slate-500'}`}>
                    {vendor.vendor_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{vendor.vendor_name}</h3>
                    <p className="text-xs text-slate-400">{vendor.adapter_key}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                  {isActive ? '已启用' : '已停用'}
                </span>
              </div>

              {/* Vendor Info */}
              {meta && (
                <p className="text-xs text-slate-500 mb-3">{meta.desc}</p>
              )}
              <div className="text-xs text-slate-400 mb-3 truncate">
                <Globe className="w-3 h-3 inline mr-1" />
                {vendor.api_base_url || '未配置端点'}
              </div>

              {/* API Key Status */}
              <div className="flex items-center gap-2 mb-4 text-xs">
                <Key className="w-3 h-3" />
                {isFree ? (
                  <span className="text-green-600 font-medium">免费厂商，无需配置</span>
                ) : hasKey ? (
                  <span className="text-green-600 font-medium">
                    API Key 已配置 ({vendor.api_key.substring(0, 8)}...{vendor.api_key.substring(vendor.api_key.length - 4)})
                  </span>
                ) : (
                  <span className="text-red-500 font-medium">未配置 API Key</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(vendor)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <Server className="w-3 h-3" />
                  配置
                </button>
                <button
                  onClick={() => toggleStatus(vendor)}
                  disabled={savingId === vendor.id}
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    isActive
                      ? 'border border-orange-200 text-orange-600 hover:bg-orange-50'
                      : 'border border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {isActive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                  {isActive ? '停用' : '启用'}
                </button>
              </div>
            </div>
          )
        })}

        {vendors.length === 0 && (
          <div className="col-span-3 py-12 text-center text-slate-400">
            暂无厂商配置数据
          </div>
        )}
      </div>

      {/* ─── Edit Modal ──────────────────────────────────── */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeEdit}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${VENDOR_META[editingVendor.adapter_key]?.color || 'bg-slate-500'}`}>
                  {editingVendor.vendor_name.charAt(0)}
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  配置 {editingVendor.vendor_name}
                </h2>
              </div>
              <button onClick={closeEdit} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error */}
            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">
                {editError}
              </div>
            )}

            {/* Free vendor tip */}
            {FREE_VENDORS.includes(editingVendor.adapter_key) && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                此厂商为免费/本地服务，无需配置 API Key。您可修改 API 端点地址。
              </div>
            )}

            <div className="space-y-4">
              {/* API Key — hidden for free vendors */}
              {!FREE_VENDORS.includes(editingVendor.adapter_key) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={editApiKey}
                      onChange={(e) => setEditApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {editApiKey && (
                    <p className="text-xs text-slate-400 mt-1">
                      当前 Key：{editApiKey.substring(0, 8)}...{editApiKey.substring(editApiKey.length - 4)}
                    </p>
                  )}
                </div>
              )}

              {/* API Secret (optional, only for paid vendors) */}
              {!FREE_VENDORS.includes(editingVendor.adapter_key) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">API Secret（可选）</label>
                  <input
                    type="password"
                    value={editApiSecret}
                    onChange={(e) => setEditApiSecret(e.target.value)}
                    placeholder="部分厂商需要"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* API Base URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API 端点地址</label>
                <input
                  type="text"
                  value={editBaseUrl}
                  onChange={(e) => setEditBaseUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Status Toggle */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                <div className="flex gap-3">
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    editStatus === 'active'
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="vendorStatus"
                      value="active"
                      checked={editStatus === 'active'}
                      onChange={() => setEditStatus('active')}
                      className="sr-only"
                    />
                    <Power className="w-4 h-4" />
                    启用
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                    editStatus === 'inactive'
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}>
                    <input
                      type="radio"
                      name="vendorStatus"
                      value="inactive"
                      checked={editStatus === 'inactive'}
                      onChange={() => setEditStatus('inactive')}
                      className="sr-only"
                    />
                    <PowerOff className="w-4 h-4" />
                    停用
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeEdit}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={savingId === editingVendor.id}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:bg-primary-400"
              >
                <Save className="w-4 h-4" />
                {savingId === editingVendor.id ? '保存中...' : '保存配置'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
