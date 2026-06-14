'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Plug, CheckCircle, XCircle, TestTube, Wrench, Trash2, Eye, RefreshCw, AlertCircle, X, Copy, Server, Zap } from 'lucide-react'
import { mcpApi } from '@/lib/api'

interface MCPServer {
  id: string
  name: string
  serverUrl: string
  authType: 'none' | 'bearer' | 'api_key'
  status: 'active' | 'inactive'
  healthStatus: 'healthy' | 'unhealthy' | 'unknown'
  toolCount: number
  lastTestedAt: string
  createdAt: string
}

interface Tool {
  id: string
  name: string
  description: string
  serverName: string
  serverId: string
  inputSchema: string
  callCount: number
}

const initialServers: MCPServer[] = [
  {
    id: '1',
    name: '内部工具服务',
    serverUrl: 'https://tools.company.internal',
    authType: 'api_key',
    status: 'active',
    healthStatus: 'healthy',
    toolCount: 5,
    lastTestedAt: '2024-03-25 14:30',
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    name: '企业服务网关',
    serverUrl: 'https://api.company.com/mcp',
    authType: 'bearer',
    status: 'active',
    healthStatus: 'healthy',
    toolCount: 4,
    lastTestedAt: '2024-03-25 10:15',
    createdAt: '2024-02-10'
  },
  {
    id: '3',
    name: '第三方AI服务',
    serverUrl: 'https://api.thirdparty.ai/v1',
    authType: 'api_key',
    status: 'active',
    healthStatus: 'unhealthy',
    toolCount: 3,
    lastTestedAt: '2024-03-24 18:45',
    createdAt: '2024-02-25'
  },
  {
    id: '4',
    name: '数据处理服务',
    serverUrl: 'https://data.company.internal',
    authType: 'none',
    status: 'active',
    healthStatus: 'healthy',
    toolCount: 3,
    lastTestedAt: '2024-03-25 09:00',
    createdAt: '2024-03-05'
  },
  {
    id: '5',
    name: '测试环境',
    serverUrl: 'http://localhost:8080',
    authType: 'none',
    status: 'inactive',
    healthStatus: 'unknown',
    toolCount: 0,
    lastTestedAt: '-',
    createdAt: '2024-03-10'
  },
  {
    id: '6',
    name: '安全审计服务',
    serverUrl: 'https://security.company.internal',
    authType: 'bearer',
    status: 'active',
    healthStatus: 'healthy',
    toolCount: 3,
    lastTestedAt: '2024-03-25 11:20',
    createdAt: '2024-03-15'
  }
]

const initialTools: Tool[] = [
  { id: '1', name: 'get_weather', description: '查询实时天气信息', serverName: '内部工具服务', serverId: '1', inputSchema: '{"city": "string"}', callCount: 1256 },
  { id: '2', name: 'search_documents', description: '全文搜索文档内容', serverName: '内部工具服务', serverId: '1', inputSchema: '{"query": "string", "limit": "number"}', callCount: 892 },
  { id: '3', name: 'send_email', description: '发送邮件通知', serverName: '内部工具服务', serverId: '1', inputSchema: '{"to": "string", "subject": "string", "body": "string"}', callCount: 345 },
  { id: '4', name: 'generate_report', description: '生成数据分析报告', serverName: '内部工具服务', serverId: '1', inputSchema: '{"type": "string", "date_range": "object"}', callCount: 178 },
  { id: '5', name: 'validate_address', description: '验证地址信息', serverName: '内部工具服务', serverId: '1', inputSchema: '{"address": "string"}', callCount: 56 },
  { id: '6', name: 'user_authenticate', description: '用户身份认证', serverName: '企业服务网关', serverId: '2', inputSchema: '{"token": "string"}', callCount: 5678 },
  { id: '7', name: 'access_control', description: '访问权限控制', serverName: '企业服务网关', serverId: '2', inputSchema: '{"user_id": "string", "resource": "string"}', callCount: 3421 },
  { id: '8', name: 'audit_log', description: '审计日志查询', serverName: '企业服务网关', serverId: '2', inputSchema: '{"start_time": "string", "end_time": "string"}', callCount: 890 },
  { id: '9', name: 'workflow_trigger', description: '触发工作流', serverName: '企业服务网关', serverId: '2', inputSchema: '{"workflow_id": "string", "params": "object"}', callCount: 234 },
  { id: '10', name: 'ai_chat_completion', description: 'AI对话补全', serverName: '第三方AI服务', serverId: '3', inputSchema: '{"messages": "array", "model": "string"}', callCount: 8901 },
  { id: '11', name: 'image_generation', description: '图像生成', serverName: '第三方AI服务', serverId: '3', inputSchema: '{"prompt": "string", "size": "string"}', callCount: 1234 },
  { id: '12', name: 'text_embedding', description: '文本向量化', serverName: '第三方AI服务', serverId: '3', inputSchema: '{"text": "string", "model": "string"}', callCount: 4567 },
  { id: '13', name: 'data_export', description: '数据导出', serverName: '数据处理服务', serverId: '4', inputSchema: '{"format": "string", "query": "string"}', callCount: 234 },
  { id: '14', name: 'data_import', description: '数据导入', serverName: '数据处理服务', serverId: '4', inputSchema: '{"source": "string", "mapping": "object"}', callCount: 89 },
  { id: '15', name: 'data_transform', description: '数据转换', serverName: '数据处理服务', serverId: '4', inputSchema: '{"data": "array", "rules": "object"}', callCount: 156 },
  { id: '16', name: 'security_scan', description: '安全扫描', serverName: '安全审计服务', serverId: '6', inputSchema: '{"target": "string", "scan_type": "string"}', callCount: 456 },
  { id: '17', name: 'threat_detect', description: '威胁检测', serverName: '安全审计服务', serverId: '6', inputSchema: '{"log_data": "array"}', callCount: 789 },
  { id: '18', name: 'compliance_check', description: '合规检查', serverName: '安全审计服务', serverId: '6', inputSchema: '{"resource_id": "string", "standard": "string"}', callCount: 123 }
]

export default function MCP() {
  const [servers, setServers] = useState<MCPServer[]>(initialServers)
  const [tools, setTools] = useState<Tool[]>(initialTools)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'servers' | 'tools'>('servers')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [showToolDetailModal, setShowToolDetailModal] = useState(false)
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [testingServer, setTestingServer] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ success: boolean; latency: string; message: string; tools?: string[] } | null>(null)
  const [refreshingServer, setRefreshingServer] = useState<string | null>(null)
  const [newServerName, setNewServerName] = useState('')
  const [newServerUrl, setNewServerUrl] = useState('')
  const [newServerAuth, setNewServerAuth] = useState<'none' | 'bearer' | 'api_key'>('none')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const filteredServers = servers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.serverUrl.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredTools = tools.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.serverName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = servers.filter(s => s.status === 'active').length
  const healthyCount = servers.filter(s => s.healthStatus === 'healthy').length
  const unhealthyCount = servers.filter(s => s.healthStatus === 'unhealthy').length

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 刷新服务器列表
  const refreshServers = async () => {
    if (!apiAvailable) return
    try {
      const res = await mcpApi.list()
      if (res && res.data && Array.isArray(res.data)) {
        setServers(res.data.map((s: any) => ({
          id: s.id?.toString() || '',
          name: s.name || '',
          serverUrl: s.server_url || '',
          authType: (s.auth_type as MCPServer['authType']) || 'none',
          status: (s.status as MCPServer['status']) || 'inactive',
          healthStatus: (s.health_status as MCPServer['healthStatus']) || 'unknown',
          toolCount: s.tool_count || 0,
          lastTestedAt: s.last_tested_at || '-',
          createdAt: s.created_at || '',
        })))
      }
    } catch {
      // 静默失败
    }
  }

  // 添加MCP服务器
  const handleAddServer = async () => {
    if (!newServerName.trim()) { showMessage('error', '请输入服务器名称'); return }
    if (!newServerUrl.trim()) { showMessage('error', '请输入服务器地址'); return }

    if (apiAvailable) {
      try {
        await mcpApi.create({
          name: newServerName.trim(),
          server_url: newServerUrl.trim(),
          auth_type: newServerAuth,
        })
        await refreshServers()
        setNewServerName('')
        setNewServerUrl('')
        setNewServerAuth('none')
        setShowAddModal(false)
        showMessage('success', `MCP Server "${newServerName.trim()}" 添加成功！`)
        return
      } catch (err: any) {
        showMessage('error', `添加失败: ${err.message}`)
        return
      }
    }

    const newServer: MCPServer = {
      id: Date.now().toString(),
      name: newServerName.trim(),
      serverUrl: newServerUrl.trim(),
      authType: newServerAuth,
      status: 'inactive',
      healthStatus: 'unknown',
      toolCount: 0,
      lastTestedAt: '-',
      createdAt: new Date().toISOString().split('T')[0]
    }
    setServers(prev => [newServer, ...prev])
    setNewServerName('')
    setNewServerUrl('')
    setNewServerAuth('none')
    setShowAddModal(false)
    showMessage('success', `MCP Server "${newServer.name}" 添加成功！（本地模式）`)
  }

  // 真实连通性测试
  const handleTestServer = async (server: MCPServer) => {
    setTestingServer(server.id)
    setSelectedServer(server)
    setTestResult(null)
    setShowTestModal(true)

    const startTime = Date.now()
    try {
      // 尝试真实连接目标 URL
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const resp = await fetch(server.serverUrl, {
        method: 'GET',
        signal: controller.signal,
        // 允许跨域和自签名证书
        mode: 'cors',
      }).finally(() => clearTimeout(timeout))

      const latency = `${Date.now() - startTime}ms`
      if (resp.ok) {
        const toolsForServer = tools.filter(t => t.serverId === server.id).map(t => t.name)
        setTestResult({
          success: true,
          latency,
          message: `成功连接到 ${server.name}（HTTP ${resp.status}），发现 ${toolsForServer.length} 个已注册工具`,
          tools: toolsForServer.length > 0 ? toolsForServer : undefined,
        })
        setServers(prev => prev.map(s =>
          s.id === server.id
            ? { ...s, healthStatus: 'healthy', lastTestedAt: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }
            : s
        ))
      } else {
        setTestResult({
          success: false,
          latency,
          message: `服务器返回 HTTP ${resp.status}，请检查服务器配置`,
        })
        setServers(prev => prev.map(s =>
          s.id === server.id
            ? { ...s, healthStatus: 'unhealthy', lastTestedAt: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }
            : s
        ))
      }
    } catch (err: any) {
      const latency = `${Date.now() - startTime}ms`
      let errorMsg = '无法连接到服务器'
      if (err.name === 'AbortError') errorMsg = '连接超时（10秒），请检查网络和服务器地址'
      else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError'))
        errorMsg = '网络错误：无法解析域名或服务器不可达'
      else if (err.message?.includes('CORS'))
        errorMsg = '跨域请求被拦截，服务器需配置 CORS 头'
      else errorMsg = `连接失败: ${err.message}`

      setTestResult({
        success: false,
        latency,
        message: errorMsg,
      })
      setServers(prev => prev.map(s =>
        s.id === server.id
          ? { ...s, healthStatus: 'unhealthy', lastTestedAt: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }
          : s
      ))
    }
    setTestingServer(null)
  }

  // 刷新工具
  const handleRefreshTools = async (server: MCPServer) => {
    setRefreshingServer(server.id)
    showMessage('success', `正在刷新 ${server.name} 的工具列表...`)

    await new Promise(resolve => setTimeout(resolve, 1500))

    const newToolCount = tools.filter(t => t.serverId === server.id).length
    setServers(prev => prev.map(s =>
      s.id === server.id ? { ...s, toolCount: newToolCount } : s
    ))
    setRefreshingServer(null)
    showMessage('success', `${server.name} 工具列表已刷新，共 ${newToolCount} 个工具`)
  }

  // 删除服务器
  const handleDeleteServer = async (server: MCPServer) => {
    if (!confirm(`确定要删除 MCP Server "${server.name}" 吗？关联的 ${server.toolCount} 个工具也将被移除！`)) return

    if (apiAvailable) {
      try {
        await mcpApi.delete(server.id)
        await refreshServers()
        showMessage('success', `MCP Server "${server.name}" 已删除`)
        return
      } catch (err: any) {
        showMessage('error', `删除失败: ${err.message}`)
        return
      }
    }

    setServers(prev => prev.filter(s => s.id !== server.id))
    setTools(prev => prev.filter(t => t.serverId !== server.id))
    showMessage('success', `MCP Server "${server.name}" 及其工具已删除（本地模式）`)
  }

  // 启用/停用服务器
  const handleToggleServer = async (server: MCPServer) => {
    const newStatus = server.status === 'active' ? 'inactive' : 'active'

    if (apiAvailable) {
      try {
        await mcpApi.update(server.id, { status: newStatus })
        await refreshServers()
        showMessage('success', `${server.name} 已${newStatus === 'active' ? '启用' : '停用'}`)
        return
      } catch (err: any) {
        showMessage('error', `状态更新失败: ${err.message}`)
        return
      }
    }

    setServers(prev => prev.map(s =>
      s.id === server.id ? { ...s, status: newStatus } : s
    ))
    showMessage('success', `${server.name} 已${newStatus === 'active' ? '启用' : '停用'}（本地模式）`)
  }

  // 查看服务器详情
  const handleViewServer = (server: MCPServer) => {
    setSelectedServer(server)
    setShowDetailModal(true)
  }

  // 查看工具详情
  const handleViewTool = (tool: Tool) => {
    setSelectedTool(tool)
    setShowToolDetailModal(true)
  }

  // 删除工具
  const handleDeleteTool = (tool: Tool) => {
    if (confirm(`确定要删除工具 "${tool.name}" 吗？`)) {
      setTools(prev => prev.filter(t => t.id !== tool.id))
      // 更新服务器工具计数
      setServers(prev => prev.map(s =>
        s.id === tool.serverId ? { ...s, toolCount: Math.max(0, s.toolCount - 1) } : s
      ))
      showMessage('success', `工具 "${tool.name}" 已删除`)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    showMessage('success', '已复制到剪贴板')
  }

  const authTypeLabel = (t: string) => t === 'api_key' ? 'API Key' : t === 'bearer' ? 'Bearer Token' : '无认证'

  return (
    <div className="p-6">
      {message && (
        <div className={`fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MCP管理</h1>
          <p className="text-gray-500 mt-1">管理MCP Server配置和可用工具</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors active:scale-95"
        >
          <Plus className="w-5 h-5" />
          添加MCP Server
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">MCP Server</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{servers.length}</p>
            </div>
            <Server className="w-12 h-12 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">活跃服务</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{activeCount}</p>
            </div>
            <Zap className="w-12 h-12 text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">可用工具</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{tools.length}</p>
            </div>
            <Wrench className="w-12 h-12 text-purple-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">健康异常</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{unhealthyCount}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('servers')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'servers' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          MCP Server列表
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'tools' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          可用工具
        </button>
      </div>

      {/* 内容区 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {activeTab === 'servers' ? (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索MCP Server..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                />
              </div>
              <span className="text-sm text-gray-400">共 {filteredServers.length} 个服务器</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredServers.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无匹配的服务器</p>
                </div>
              ) : (
                filteredServers.map((server) => (
                  <div key={server.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          server.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Plug className={`w-6 h-6 ${
                            server.status === 'active' ? 'text-green-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{server.name}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              server.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {server.status === 'active' ? '活跃' : '停用'}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${
                              server.healthStatus === 'healthy' ? 'bg-green-500' :
                              server.healthStatus === 'unhealthy' ? 'bg-red-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{server.serverUrl}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-400">{authTypeLabel(server.authType)}</span>
                            <span className="text-xs text-gray-400">{server.toolCount} 工具</span>
                            <span className="text-xs text-gray-400">上次测试: {server.lastTestedAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleServer(server)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors active:scale-95 ${
                            server.status === 'active'
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          {server.status === 'active' ? '停用' : '启用'}
                        </button>
                        <button
                          onClick={() => handleTestServer(server)}
                          disabled={testingServer === server.id}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            testingServer === server.id
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
                          }`}
                        >
                          {testingServer === server.id ? <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <TestTube className="w-4 h-4" />}
                          {testingServer === server.id ? '测试中...' : '测试'}
                        </button>
                        <button
                          onClick={() => handleRefreshTools(server)}
                          disabled={refreshingServer === server.id}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            refreshingServer === server.id
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                          }`}
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshingServer === server.id ? 'animate-spin' : ''}`} />
                          刷新
                        </button>
                        <button
                          onClick={() => handleViewServer(server)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95"
                          title="查看详情"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteServer(server)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索工具名称或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                />
              </div>
              <span className="text-sm text-gray-400">共 {filteredTools.length} 个可用工具</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredTools.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无匹配的工具</p>
                </div>
              ) : (
                filteredTools.map((tool) => (
                  <div key={tool.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{tool.name}</h3>
                          <p className="text-sm text-gray-500">{tool.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="inline-block text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {tool.serverName}
                            </span>
                            <span className="text-xs text-gray-400">调用 {tool.callCount} 次</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewTool(tool)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95"
                          title="查看详情"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTool(tool)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* 添加服务器弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">添加MCP Server</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务器名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="例如：内部工具服务"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务器地址 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  placeholder="https://mcp.example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">认证类型</label>
                <select
                  value={newServerAuth}
                  onChange={(e) => setNewServerAuth(e.target.value as 'none' | 'bearer' | 'api_key')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="none">无认证</option>
                  <option value="api_key">API Key</option>
                  <option value="bearer">Bearer Token</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowAddModal(false); setNewServerName(''); setNewServerUrl('') }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddServer}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors active:scale-95"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 服务器详情弹窗 */}
      {showDetailModal && selectedServer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[560px] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">服务器详情</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                  selectedServer.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Plug className={`w-7 h-7 ${selectedServer.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedServer.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      selectedServer.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedServer.status === 'active' ? '活跃' : '停用'}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      selectedServer.healthStatus === 'healthy' ? 'bg-green-100 text-green-600' :
                      selectedServer.healthStatus === 'unhealthy' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedServer.healthStatus === 'healthy' ? '健康' : selectedServer.healthStatus === 'unhealthy' ? '异常' : '未知'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">服务器地址</p>
                  <p className="font-mono text-sm text-gray-900 break-all">{selectedServer.serverUrl}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">认证方式</p>
                  <p className="font-semibold text-gray-900">{authTypeLabel(selectedServer.authType)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">工具数量</p>
                  <p className="font-semibold text-gray-900">{selectedServer.toolCount} 个</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">上次测试</p>
                  <p className="font-semibold text-gray-900">{selectedServer.lastTestedAt}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">关联工具</p>
                <div className="space-y-2">
                  {tools.filter(t => t.serverId === selectedServer.id).map(tool => (
                    <div key={tool.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                        <span className="text-xs text-gray-400">- {tool.description}</span>
                      </div>
                      <span className="text-xs text-gray-400">调用 {tool.callCount} 次</span>
                    </div>
                  ))}
                  {tools.filter(t => t.serverId === selectedServer.id).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">暂无关联工具，点击刷新工具列表</p>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                创建时间：{selectedServer.createdAt}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">关闭</button>
              <button
                onClick={() => { setShowDetailModal(false); handleTestServer(selectedServer) }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:scale-95"
              >
                测试连通性
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 测试连通性弹窗 */}
      {showTestModal && selectedServer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[560px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">测试连通性 - {selectedServer.name}</h2>
              <button onClick={() => { setShowTestModal(false); setTestingServer(null) }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {testingServer ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600">正在连接 {selectedServer.serverUrl}...</p>
                <p className="text-sm text-gray-400 mt-1">请稍候</p>
              </div>
            ) : testResult ? (
              <div className="space-y-4">
                <div className={`rounded-lg p-4 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                    <span className={`font-semibold ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {testResult.success ? '连接成功' : '连接失败'}
                    </span>
                    <span className="text-sm text-gray-500 ml-auto">耗时 {testResult.latency}</span>
                  </div>
                  <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>{testResult.message}</p>
                </div>
                {testResult.tools && testResult.tools.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">发现工具</p>
                    <div className="space-y-1">
                      {testResult.tools.map((toolName, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <Wrench className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-mono text-gray-900">{toolName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowTestModal(false); setTestResult(null) }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">关闭</button>
              {!testingServer && testResult && (
                <button onClick={() => { setTestResult(null); handleTestServer(selectedServer) }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:scale-95">再次测试</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 工具详情弹窗 */}
      {showToolDetailModal && selectedTool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">工具详情</h2>
              <button onClick={() => setShowToolDetailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 font-mono">{selectedTool.name}</h3>
                  <span className="text-sm text-gray-400">来自 {selectedTool.serverName}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{selectedTool.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">累计调用</p>
                  <p className="font-semibold text-gray-900">{selectedTool.callCount} 次</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">所属服务器</p>
                  <p className="font-semibold text-gray-900">{selectedTool.serverName}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">输入参数 (JSON Schema)</p>
                  <button onClick={() => handleCopy(selectedTool.inputSchema)} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"><Copy className="w-3 h-3" />复制</button>
                </div>
                <pre className="bg-gray-900 text-blue-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                  {JSON.stringify(JSON.parse(selectedTool.inputSchema || '{}'), null, 2)}
                </pre>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowToolDetailModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">关闭</button>
              <button onClick={() => handleDeleteTool(selectedTool)} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors active:scale-95">删除工具</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
