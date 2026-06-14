import { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Activity, Clock, Server } from 'lucide-react'
import { nodes as fixtureNodes, type Node } from '@/fixtures/nodes'
import { api } from '@/lib/api'

export default function Nodes() {
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState<Node[]>(fixtureNodes)

  // 从后端获取节点健康数据，失败时回退 fixture
  const fetchNodes = async () => {
    try {
      const json = await api.nodes.health()
      if (json.data && Array.isArray(json.data)) {
        setNodes(json.data)
        return
      }
    } catch (err) {
      console.error('获取节点数据失败，使用 fixture 数据:', (err as Error).message)
    }
    setNodes(fixtureNodes)
  }

  useEffect(() => {
    fetchNodes().finally(() => setLoading(false))
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchNodes()
    setRefreshing(false)
  }

  const statusConfig = {
    healthy: { label: '健康', color: 'bg-green-500', bg: 'bg-green-100', text: 'text-green-600' },
    warning: { label: '警告', color: 'bg-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-600' },
    critical: { label: '异常', color: 'bg-red-500', bg: 'bg-red-100', text: 'text-red-600' }
  }

  const healthyCount = nodes.filter(n => n.status === 'healthy').length
  const warningCount = nodes.filter(n => n.status === 'warning').length
  const criticalCount = nodes.filter(n => n.status === 'critical').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">节点监控</h1>
          <p className="text-slate-500 mt-1">实时监控各模型节点状态</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-sm text-slate-600">{healthyCount} 健康</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span className="text-sm text-slate-600">{warningCount} 警告</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span className="text-sm text-slate-600">{criticalCount} 异常</span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map(node => {
          const config = statusConfig[node.status]
          const loadColor = node.load > 80 ? 'text-red-600' : node.load > 60 ? 'text-yellow-600' : 'text-green-600'
          const latencyColor = node.latency > 100 ? 'text-red-600' : node.latency > 50 ? 'text-yellow-600' : 'text-green-600'

          return (
            <div
              key={node.id}
              className={`p-4 rounded-xl border transition-all ${
                node.status === 'critical' ? 'border-red-200 bg-red-50/50' :
                node.status === 'warning' ? 'border-yellow-200 bg-yellow-50/50' :
                'border-slate-200 bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center`}>
                    <Server className={`w-5 h-5 ${config.text}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800">{node.name}</h3>
                    <p className="text-xs text-slate-500">{node.vendor} - {node.region}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                  {config.label}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Activity className="w-4 h-4" />
                    <span>负载</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${node.load > 80 ? 'bg-red-500' : node.load > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${node.load}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${loadColor}`}>{node.load}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>延迟</span>
                  </div>
                  <span className={`text-sm font-medium ${latencyColor}`}>{node.latency}ms</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Server className="w-4 h-4" />
                    <span>请求数</span>
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    {node.activeRequests}/{node.maxRequests}
                  </span>
                </div>
              </div>

              {node.status !== 'healthy' && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className={`flex items-start gap-2 ${config.text}`}>
                    {node.status === 'critical' ? <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    <p className="text-xs">
                      {node.status === 'critical' 
                        ? '节点负载过高，请检查或切换至备用节点' 
                        : '节点响应较慢，建议关注'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">节点状态统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-3xl font-bold text-slate-800">{healthyCount}</span>
            </div>
            <p className="text-sm text-slate-500">健康节点</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <span className="text-3xl font-bold text-slate-800">{warningCount}</span>
            </div>
            <p className="text-sm text-slate-500">警告节点</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <span className="text-3xl font-bold text-slate-800">{criticalCount}</span>
            </div>
            <p className="text-sm text-slate-500">异常节点</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Server className="w-6 h-6 text-blue-600" />
              <span className="text-3xl font-bold text-slate-800">{nodes.length}</span>
            </div>
            <p className="text-sm text-slate-500">总节点数</p>
          </div>
        </div>
      </div>
    </div>
  )
}
