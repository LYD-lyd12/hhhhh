'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Search, Upload, Wand2, Code2, Trash2, Eye, Play, CheckCircle, AlertCircle, X, FileCode, Copy } from 'lucide-react'
import { skillApi } from '@/lib/api'

interface Skill {
  id: string
  name: string
  description: string
  version: string
  status: 'draft' | 'online' | 'offline'
  paramCount: number
  paramsSchema: string
  codePath: string
  callCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

const initialSkills: Skill[] = [
  {
    id: '1',
    name: '天气查询',
    description: '根据城市名称查询实时天气信息，支持国内300+城市',
    version: '1.0.0',
    status: 'online',
    paramCount: 2,
    paramsSchema: '{"city": {"type": "string", "description": "城市名称"}, "unit": {"type": "string", "enum": ["celsius", "fahrenheit"], "description": "温度单位"}}',
    codePath: '/skills/weather-query-v1.zip',
    callCount: 1256,
    createdBy: 'admin',
    createdAt: '2024-01-15',
    updatedAt: '2024-03-20'
  },
  {
    id: '2',
    name: '股票查询',
    description: '查询股票实时行情和历史数据，支持沪深A股、港股、美股',
    version: '2.1.0',
    status: 'online',
    paramCount: 3,
    paramsSchema: '{"symbol": {"type": "string", "description": "股票代码"}, "market": {"type": "string", "enum": ["A", "HK", "US"], "description": "市场"}, "period": {"type": "string", "description": "时间范围"}}',
    codePath: '/skills/stock-query-v2.1.zip',
    callCount: 3421,
    createdBy: 'admin',
    createdAt: '2024-02-20',
    updatedAt: '2024-03-18'
  },
  {
    id: '3',
    name: '邮件发送',
    description: '发送邮件通知，支持SMTP协议，支持附件发送',
    version: '1.0.0',
    status: 'draft',
    paramCount: 4,
    paramsSchema: '{"to": {"type": "string", "description": "收件人"}, "subject": {"type": "string", "description": "主题"}, "body": {"type": "string", "description": "正文"}, "attachments": {"type": "array", "description": "附件列表"}}',
    codePath: '',
    callCount: 0,
    createdBy: 'admin',
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10'
  },
  {
    id: '4',
    name: '文档解析',
    description: '解析PDF和Word文档内容，提取文本和元数据',
    version: '1.2.0',
    status: 'offline',
    paramCount: 2,
    paramsSchema: '{"file_url": {"type": "string", "description": "文件URL"}, "extract_type": {"type": "string", "enum": ["text", "metadata", "both"], "description": "提取类型"}}',
    codePath: '/skills/doc-parser-v1.2.zip',
    callCount: 567,
    createdBy: 'admin',
    createdAt: '2024-01-25',
    updatedAt: '2024-02-28'
  },
  {
    id: '5',
    name: '地图搜索',
    description: '根据地址或关键词搜索地理位置信息',
    version: '1.5.0',
    status: 'online',
    paramCount: 3,
    paramsSchema: '{"query": {"type": "string", "description": "搜索关键词"}, "city": {"type": "string", "description": "城市"}, "limit": {"type": "number", "description": "返回数量"}}',
    codePath: '/skills/map-search-v1.5.zip',
    callCount: 892,
    createdBy: 'admin',
    createdAt: '2024-02-28',
    updatedAt: '2024-03-15'
  },
  {
    id: '6',
    name: '翻译工具',
    description: '支持多种语言互译，支持100+语言',
    version: '2.0.0',
    status: 'online',
    paramCount: 3,
    paramsSchema: '{"text": {"type": "string", "description": "待翻译文本"}, "source_lang": {"type": "string", "description": "源语言"}, "target_lang": {"type": "string", "description": "目标语言"}}',
    codePath: '/skills/translator-v2.zip',
    callCount: 2103,
    createdBy: 'admin',
    createdAt: '2024-03-05',
    updatedAt: '2024-03-22'
  },
  {
    id: '7',
    name: '新闻资讯',
    description: '获取最新新闻资讯，支持多种分类',
    version: '1.3.0',
    status: 'online',
    paramCount: 2,
    paramsSchema: '{"category": {"type": "string", "enum": ["tech", "finance", "sports", "entertainment"], "description": "新闻分类"}, "limit": {"type": "number", "description": "返回数量"}}',
    codePath: '/skills/news-v1.3.zip',
    callCount: 756,
    createdBy: 'admin',
    createdAt: '2024-03-12',
    updatedAt: '2024-03-25'
  },
  {
    id: '8',
    name: '图片识别',
    description: '图片内容识别，支持物体检测、文字识别',
    version: '1.1.0',
    status: 'draft',
    paramCount: 2,
    paramsSchema: '{"image_url": {"type": "string", "description": "图片URL"}, "mode": {"type": "string", "enum": ["object", "ocr", "both"], "description": "识别模式"}}',
    codePath: '',
    callCount: 0,
    createdBy: 'admin',
    createdAt: '2024-03-18',
    updatedAt: '2024-03-18'
  },
  {
    id: '9',
    name: '日历查询',
    description: '查询节假日信息、工作日判断',
    version: '1.0.0',
    status: 'online',
    paramCount: 2,
    paramsSchema: '{"date": {"type": "string", "description": "日期"}, "country": {"type": "string", "description": "国家代码"}}',
    codePath: '/skills/calendar-v1.zip',
    callCount: 445,
    createdBy: 'admin',
    createdAt: '2024-03-20',
    updatedAt: '2024-03-20'
  },
  {
    id: '10',
    name: '数据统计',
    description: '数据统计分析，支持多种图表生成',
    version: '1.2.0',
    status: 'offline',
    paramCount: 5,
    paramsSchema: '{"data": {"type": "array", "description": "数据集"}, "chart_type": {"type": "string", "description": "图表类型"}, "title": {"type": "string", "description": "标题"}, "x_axis": {"type": "string", "description": "X轴字段"}, "y_axis": {"type": "string", "description": "Y轴字段"}}',
    codePath: '/skills/data-stats-v1.2.zip',
    callCount: 234,
    createdBy: 'admin',
    createdAt: '2024-02-15',
    updatedAt: '2024-03-01'
  },
  {
    id: '11',
    name: '短链接生成',
    description: '将长链接转换为短链接',
    version: '1.0.0',
    status: 'online',
    paramCount: 2,
    paramsSchema: '{"url": {"type": "string", "description": "原始URL"}, "custom_alias": {"type": "string", "description": "自定义别名"}}',
    codePath: '/skills/short-url-v1.zip',
    callCount: 1890,
    createdBy: 'admin',
    createdAt: '2024-03-22',
    updatedAt: '2024-03-22'
  },
  {
    id: '12',
    name: '二维码生成',
    description: '生成二维码图片，支持多种格式',
    version: '1.1.0',
    status: 'online',
    paramCount: 3,
    paramsSchema: '{"content": {"type": "string", "description": "二维码内容"}, "size": {"type": "number", "description": "尺寸"}, "format": {"type": "string", "enum": ["png", "svg", "jpg"], "description": "输出格式"}}',
    codePath: '/skills/qrcode-v1.1.zip',
    callCount: 678,
    createdBy: 'admin',
    createdAt: '2024-03-25',
    updatedAt: '2024-03-25'
  }
]

// 模拟测试返回结果
const testResults: Record<string, { input: string; output: string; latency: string }> = {
  '天气查询': { input: '{"city": "北京"}', output: '{"city": "北京", "temperature": "22°C", "weather": "晴", "humidity": "45%", "wind": "北风3级"}', latency: '128ms' },
  '股票查询': { input: '{"symbol": "600519", "market": "A"}', output: '{"symbol": "600519", "name": "贵州茅台", "price": 1688.50, "change": "+1.23%", "volume": "2.3万手"}', latency: '256ms' },
  '地图搜索': { input: '{"query": "天安门", "city": "北京"}', output: '{"name": "天安门", "address": "北京市东城区东长安街", "lat": 39.9087, "lng": 116.3975, "phone": "010-6525XXXX"}', latency: '89ms' },
  '翻译工具': { input: '{"text": "Hello World", "source_lang": "en", "target_lang": "zh"}', output: '{"translated": "你好世界", "confidence": 0.98, "detected_lang": "en"}', latency: '312ms' },
  '新闻资讯': { input: '{"category": "tech", "limit": 3}', output: '{"articles": [{"title": "AI大模型最新进展", "source": "科技日报"}, {"title": "量子计算突破", "source": "新华网"}, {"title": "5G应用落地加速", "source": "人民网"}]}', latency: '156ms' },
  '日历查询': { input: '{"date": "2024-10-01", "country": "CN"}', output: '{"date": "2024-10-01", "holiday": "国庆节", "is_workday": false, "duration": "7天假期"}', latency: '45ms' },
  '短链接生成': { input: '{"url": "https://example.com/very/long/url/path"}', output: '{"short_url": "https://t.tt/abc123", "original_url": "https://example.com/very/long/url/path", "expiry": "2025-01-01"}', latency: '67ms' },
  '二维码生成': { input: '{"content": "https://example.com", "size": 256, "format": "png"}', output: '{"qr_url": "https://qr.tt/xyz789.png", "size": "256x256", "format": "png", "content": "https://example.com"}', latency: '98ms' },
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [apiAvailable, setApiAvailable] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [testingSkill, setTestingSkill] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ input: string; output: string; latency: string } | null>(null)
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillDescription, setNewSkillDescription] = useState('')
  const [newSkillParams, setNewSkillParams] = useState('')
  const [uploadTarget, setUploadTarget] = useState<Skill | null>(null)
  const [uploadFileName, setUploadFileName] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredSkills = skills.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const onlineCount = skills.filter(s => s.status === 'online').length
  const draftCount = skills.filter(s => s.status === 'draft').length
  const offlineCount = skills.filter(s => s.status === 'offline').length

  // 页面加载时尝试从后端 API 获取技能列表
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const res = await skillApi.list()
        if (res && res.data && Array.isArray(res.data)) {
          setSkills(res.data.map((s: any) => ({
            id: s.id?.toString() || '',
            name: s.name || '',
            description: s.description || '',
            version: s.version || '1.0.0',
            status: (s.status as Skill['status']) || 'draft',
            paramCount: s.params_schema ? Object.keys(typeof s.params_schema === 'string' ? JSON.parse(s.params_schema) : s.params_schema).length : 0,
            paramsSchema: typeof s.params_schema === 'string' ? s.params_schema : JSON.stringify(s.params_schema || {}),
            codePath: s.code_path || '',
            callCount: s.call_count || 0,
            createdBy: s.created_by || 'admin',
            createdAt: s.created_at || '',
            updatedAt: s.updated_at || '',
          })))
          setApiAvailable(true)
        }
      } catch {
        console.log('技能后端未启动，使用本地数据')
      } finally {
        setDataLoading(false)
      }
    }
    loadSkills()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 刷新技能列表
  const refreshSkills = async () => {
    if (!apiAvailable) return
    try {
      const res = await skillApi.list()
      if (res && res.data && Array.isArray(res.data)) {
        setSkills(res.data.map((s: any) => ({
          id: s.id?.toString() || '',
          name: s.name || '',
          description: s.description || '',
          version: s.version || '1.0.0',
          status: (s.status as Skill['status']) || 'draft',
          paramCount: s.params_schema ? Object.keys(typeof s.params_schema === 'string' ? JSON.parse(s.params_schema) : s.params_schema).length : 0,
          paramsSchema: typeof s.params_schema === 'string' ? s.params_schema : JSON.stringify(s.params_schema || {}),
          codePath: s.code_path || '',
          callCount: s.call_count || 0,
          createdBy: s.created_by || 'admin',
          createdAt: s.created_at || '',
          updatedAt: s.updated_at || '',
        })))
      }
    } catch {
      // 静默失败
    }
  }

  // 新建技能
  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) {
      showMessage('error', '请输入技能名称')
      return
    }
    if (!newSkillDescription.trim()) {
      showMessage('error', '请输入技能描述')
      return
    }

    // 尝试调用后端 API 创建
    if (apiAvailable) {
      try {
        let paramsSchema: object | undefined
        if (newSkillParams) {
          try { paramsSchema = JSON.parse(newSkillParams) } catch { /* ignore */ }
        }
        await skillApi.create({
          name: newSkillName.trim(),
          description: newSkillDescription.trim(),
          version: '1.0.0',
          params_schema: paramsSchema,
          created_by: 'admin',
        })
        await refreshSkills()
        setNewSkillName('')
        setNewSkillDescription('')
        setNewSkillParams('')
        setShowCreateModal(false)
        showMessage('success', `技能 "${newSkillName.trim()}" 创建成功！`)
        return
      } catch (err: any) {
        showMessage('error', `创建失败: ${err.message}`)
        return
      }
    }

    // API 不可用时本地创建
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: newSkillName.trim(),
      description: newSkillDescription.trim(),
      version: '1.0.0',
      status: 'draft',
      paramCount: newSkillParams ? Object.keys(JSON.parse(newSkillParams)).length : 0,
      paramsSchema: newSkillParams || '{}',
      codePath: '',
      callCount: 0,
      createdBy: 'admin',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    }
    setSkills(prev => [newSkill, ...prev])
    setNewSkillName('')
    setNewSkillDescription('')
    setNewSkillParams('')
    setShowCreateModal(false)
    showMessage('success', `技能 "${newSkill.name}" 创建成功！状态：草稿（本地模式）`)
  }

  // 测试技能
  const handleTestSkill = async (skill: Skill) => {
    if (skill.status !== 'online') {
      showMessage('error', '只有上线状态的技能才能测试！')
      return
    }
    setTestingSkill(skill.id)
    setSelectedSkill(skill)
    setTestResult(null)
    setShowTestModal(true)

    await new Promise(resolve => setTimeout(resolve, 1500))

    const result = testResults[skill.name] || {
      input: '{}',
      output: `{"status": "ok", "message": "${skill.name} 调用成功", "timestamp": "${new Date().toISOString()}"}`,
      latency: `${Math.floor(Math.random() * 300 + 50)}ms`
    }
    setTestResult(result)
    setTestingSkill(null)
  }

  // 查看详情
  const handleViewSkill = (skill: Skill) => {
    setSelectedSkill(skill)
    setShowDetailModal(true)
  }

  // 删除技能
  const handleDeleteSkill = async (skill: Skill) => {
    if (!confirm(`确定要删除技能 "${skill.name}" 吗？此操作不可恢复！`)) return

    if (apiAvailable) {
      try {
        await skillApi.delete(skill.id)
        await refreshSkills()
        showMessage('success', `技能 "${skill.name}" 已删除`)
        return
      } catch (err: any) {
        showMessage('error', `删除失败: ${err.message}`)
        return
      }
    }

    setSkills(prev => prev.filter(s => s.id !== skill.id))
    showMessage('success', `技能 "${skill.name}" 已删除（本地模式）`)
  }

  // 上线/下线切换
  const handleToggleStatus = async (skill: Skill) => {
    const newStatus: 'draft' | 'online' | 'offline' = skill.status === 'online' ? 'offline' : 'online'

    if (apiAvailable) {
      try {
        await skillApi.updateStatus(skill.id, newStatus)
        await refreshSkills()
        showMessage('success', `技能 "${skill.name}" 已${newStatus === 'online' ? '上线' : '下线'}`)
        return
      } catch (err: any) {
        showMessage('error', `状态更新失败: ${err.message}`)
        return
      }
    }

    setSkills(prev => prev.map(s =>
      s.id === skill.id
        ? { ...s, status: newStatus, updatedAt: new Date().toISOString().split('T')[0] }
        : s
    ))
    showMessage('success', `技能 "${skill.name}" 已${newStatus === 'online' ? '上线' : '下线'}（本地模式）`)
  }

  // 上传代码包
  const handleUploadClick = (skill?: Skill) => {
    if (skill) {
      setUploadTarget(skill)
      setUploadFileName('')
    } else {
      setUploadTarget(null)
      setUploadFileName('')
    }
    setShowUploadModal(true)
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFileName(file.name)
    }
  }

  const handleUploadConfirm = () => {
    if (!uploadFileName) {
      showMessage('error', '请先选择文件')
      return
    }
    if (uploadTarget) {
      setSkills(prev => prev.map(s =>
        s.id === uploadTarget.id
          ? { ...s, codePath: `/skills/${uploadFileName}`, updatedAt: new Date().toISOString().split('T')[0] }
          : s
      ))
      showMessage('success', `代码包 "${uploadFileName}" 已上传到技能 "${uploadTarget.name}"`)
    } else {
      showMessage('success', `代码包 "${uploadFileName}" 上传成功！`)
    }
    setShowUploadModal(false)
    setUploadFileName('')
    setUploadTarget(null)
  }

  // 复制到剪贴板
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    showMessage('success', '已复制到剪贴板')
  }

  return (
    <div className="p-6">
      {message && (
        <div className={`fixed top-20 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">技能资产库</h1>
          <p className="text-gray-500 mt-1">管理AI可调用的工具插件</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleUploadClick()}
            className="flex items-center gap-2 bg-purple-100 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors active:scale-95"
          >
            <Upload className="w-4 h-4" />
            上传代码包
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors active:scale-95"
          >
            <Plus className="w-5 h-5" />
            新建技能
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">技能总数</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{skills.length}</p>
            </div>
            <Wand2 className="w-12 h-12 text-purple-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">已上线</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{onlineCount}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">草稿</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{draftCount}</p>
            </div>
            <Code2 className="w-12 h-12 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">已下线</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{offlineCount}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索技能名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>
          <span className="text-sm text-gray-400">共 {filteredSkills.length} 个技能</span>
        </div>

        {/* 技能列表 */}
        <div className="divide-y divide-gray-100">
          {filteredSkills.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-400">
              <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无匹配的技能</p>
            </div>
          ) : (
            filteredSkills.map((skill) => (
              <div key={skill.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      skill.status === 'online' ? 'bg-green-100' :
                      skill.status === 'draft' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      <Wand2 className={`w-6 h-6 ${
                        skill.status === 'online' ? 'text-green-600' :
                        skill.status === 'draft' ? 'text-yellow-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          skill.status === 'online' ? 'bg-green-100 text-green-600' :
                          skill.status === 'draft' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {skill.status === 'online' ? '上线' : skill.status === 'draft' ? '草稿' : '下线'}
                        </span>
                        <span className="text-xs text-gray-400">v{skill.version}</span>
                        {skill.codePath && <span className="text-xs text-blue-500 flex items-center gap-0.5"><FileCode className="w-3 h-3" />有代码包</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{skill.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        <span>{skill.paramCount} 个参数</span>
                        <span>调用 {skill.callCount} 次</span>
                        <span>更新于 {skill.updatedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(skill)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors active:scale-95 ${
                        skill.status === 'online'
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                    >
                      {skill.status === 'online' ? '下线' : skill.status === 'draft' ? '上线' : '上线'}
                    </button>
                    <button
                      onClick={() => handleTestSkill(skill)}
                      disabled={testingSkill === skill.id || skill.status !== 'online'}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        testingSkill === skill.id
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : skill.status !== 'online'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
                      }`}
                    >
                      {testingSkill === skill.id ? <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
                      {testingSkill === skill.id ? '测试中...' : '测试'}
                    </button>
                    <button
                      onClick={() => handleUploadClick(skill)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors active:scale-95"
                      title="上传代码包"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleViewSkill(skill)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95"
                      title="查看详情"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(skill)}
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
      </div>

      {/* 新建技能弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">新建技能</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">技能名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="例如：天气查询"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述 <span className="text-red-500">*</span></label>
                <textarea
                  value={newSkillDescription}
                  onChange={(e) => setNewSkillDescription(e.target.value)}
                  placeholder="请输入技能功能描述"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">参数定义 (JSON Schema)</label>
                <textarea
                  value={newSkillParams}
                  onChange={(e) => setNewSkillParams(e.target.value)}
                  placeholder='{"param1": {"type": "string", "description": "参数1描述"}}'
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setNewSkillName(''); setNewSkillDescription(''); setNewSkillParams('') }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateSkill}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors active:scale-95"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 技能详情弹窗 */}
      {showDetailModal && selectedSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[560px] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">技能详情</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                  selectedSkill.status === 'online' ? 'bg-green-100' :
                  selectedSkill.status === 'draft' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  <Wand2 className={`w-7 h-7 ${
                    selectedSkill.status === 'online' ? 'text-green-600' :
                    selectedSkill.status === 'draft' ? 'text-yellow-600' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedSkill.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      selectedSkill.status === 'online' ? 'bg-green-100 text-green-600' :
                      selectedSkill.status === 'draft' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedSkill.status === 'online' ? '上线' : selectedSkill.status === 'draft' ? '草稿' : '下线'}
                    </span>
                    <span className="text-sm text-gray-400">v{selectedSkill.version}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{selectedSkill.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">参数数量</p>
                  <p className="font-semibold text-gray-900">{selectedSkill.paramCount} 个</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">累计调用</p>
                  <p className="font-semibold text-gray-900">{selectedSkill.callCount} 次</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">创建者</p>
                  <p className="font-semibold text-gray-900">{selectedSkill.createdBy}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">代码包</p>
                  <p className="font-semibold text-gray-900 text-sm">{selectedSkill.codePath || '未上传'}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">参数定义 (JSON Schema)</p>
                  <button onClick={() => handleCopy(selectedSkill.paramsSchema)} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"><Copy className="w-3 h-3" />复制</button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                  {JSON.stringify(JSON.parse(selectedSkill.paramsSchema || '{}'), null, 2)}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">创建时间：</span><span className="text-gray-900">{selectedSkill.createdAt}</span></div>
                <div><span className="text-gray-500">更新时间：</span><span className="text-gray-900">{selectedSkill.updatedAt}</span></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
              <button
                onClick={() => { setShowDetailModal(false); handleTestSkill(selectedSkill) }}
                disabled={selectedSkill.status !== 'online'}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  selectedSkill.status === 'online' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                测试调用
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 测试弹窗 */}
      {showTestModal && selectedSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[560px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">测试技能 - {selectedSkill.name}</h2>
              <button onClick={() => { setShowTestModal(false); setTestingSkill(null) }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            {testingSkill ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600">正在调用 {selectedSkill.name}...</p>
                <p className="text-sm text-gray-400 mt-1">请稍候</p>
              </div>
            ) : testResult ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">请求参数</p>
                  <pre className="bg-gray-900 text-blue-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                    {JSON.stringify(JSON.parse(testResult.input), null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">返回结果</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" />成功</span>
                      <span className="text-xs text-gray-400">耗时 {testResult.latency}</span>
                      <button onClick={() => handleCopy(testResult.output)} className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"><Copy className="w-3 h-3" />复制</button>
                    </div>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                    {JSON.stringify(JSON.parse(testResult.output), null, 2)}
                  </pre>
                </div>
              </div>
            ) : null}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowTestModal(false); setTestResult(null) }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
              {!testingSkill && testResult && (
                <button
                  onClick={() => { setTestResult(null); handleTestSkill(selectedSkill) }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:scale-95"
                >
                  再次测试
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 上传代码包弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                上传代码包 {uploadTarget ? `- ${uploadTarget.name}` : ''}
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div
                onClick={handleFileSelect}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">点击选择文件或拖拽到此处</p>
                <p className="text-xs text-gray-400 mt-2">支持 .zip, .py, .js, .ts 文件</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.py,.js,.ts"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {uploadFileName && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                  <FileCode className="w-4 h-4" />
                  <span className="text-sm">{uploadFileName}</span>
                  <CheckCircle className="w-4 h-4 ml-auto" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUploadConfirm}
                disabled={!uploadFileName}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  uploadFileName ? 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                确认上传
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
