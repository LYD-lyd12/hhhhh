'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Search, Upload, BookOpen, FileText, Trash2, Eye, Database, AlertCircle, CheckCircle, X, Copy, Download, Loader2 } from 'lucide-react'
import { kbApi } from '@/lib/api'

interface KnowledgeBase {
  id: string
  name: string
  description: string
  documentCount: number
  chunkCount: number
  embeddingModel: string
  status: 'active' | 'building' | 'error'
  totalSize: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface Document {
  id: string
  fileName: string
  fileSize: string
  status: 'processing' | 'completed' | 'failed'
  chunkCount: number
  kbName: string
  kbId: string
  uploadedBy: string
  createdAt: string
}

// 将后端 kb 响应转化为前端 KnowledgeBase 格式
function mapKbResponse(kb: Record<string, unknown>): KnowledgeBase {
  return {
    id: String(kb.id),
    name: String(kb.name),
    description: String(kb.description || ''),
    documentCount: Number(kb.document_count ?? 0),
    chunkCount: Number(kb.chunk_count ?? 0),
    embeddingModel: String(kb.embedding_model || 'bge-large-zh'),
    status: 'active',
    totalSize: '0 MB',
    createdBy: String(kb.created_by || 'admin'),
    createdAt: String(kb.created_at || '').split('T')[0],
    updatedAt: String(kb.updated_at || '').split('T')[0],
  }
}

const initialDocuments: Document[] = []

// 本地演示数据（后端不可用时使用）
const DEMO_KBS: KnowledgeBase[] = [
  {
    id: 'demo-1', name: '产品文档库', description: '产品需求文档、设计文档、API文档',
    documentCount: 12, chunkCount: 256, embeddingModel: 'bge-large-zh',
    status: 'active', totalSize: '24.5 MB', createdBy: 'admin',
    createdAt: '2024-01-15', updatedAt: '2024-01-15'
  },
  {
    id: 'demo-2', name: '技术博客库', description: '技术文章、教程、最佳实践',
    documentCount: 8, chunkCount: 180, embeddingModel: 'bge-large-zh',
    status: 'active', totalSize: '12.3 MB', createdBy: 'admin',
    createdAt: '2024-01-10', updatedAt: '2024-01-14'
  },
  {
    id: 'demo-3', name: '客服FAQ库', description: '常见问题解答、知识条目',
    documentCount: 45, chunkCount: 520, embeddingModel: 'bge-large-zh',
    status: 'active', totalSize: '8.7 MB', createdBy: 'admin',
    createdAt: '2024-01-08', updatedAt: '2024-01-13'
  },
]


export default function KB() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendAvailable, setBackendAvailable] = useState(true) // 后端是否可用
  const [activeTab, setActiveTab] = useState<'kbs' | 'documents'>('kbs')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDocDetailModal, setShowDocDetailModal] = useState(false)
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [newKbName, setNewKbName] = useState('')
  const [newKbDescription, setNewKbDescription] = useState('')
  const [newKbModel, setNewKbModel] = useState('bge-large-zh')
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadTargetKb, setUploadTargetKb] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始化加载知识库列表
  useEffect(() => {
    loadKbs()
  }, [])

  const loadKbs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await kbApi.list()
      const items: unknown[] = Array.isArray(data) ? data : (data.items ?? [])
      setKbs(items.map(item => mapKbResponse(item as Record<string, unknown>)))
      setBackendAvailable(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '知识库后端未启动'
      console.log('[KB] 知识库后端未启动，使用本地演示数据:', msg)
      // 降级到本地演示数据
      setKbs(DEMO_KBS)
      setBackendAvailable(false)
    } finally {
      setLoading(false)
    }
  }

  const filteredKbs = kbs.filter(k =>
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.description.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredDocs = documents.filter(d =>
    d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.kbName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalDocs = kbs.reduce((sum, kb) => sum + kb.documentCount, 0)
  const totalChunks = kbs.reduce((sum, kb) => sum + kb.chunkCount, 0)
  const processingCount = documents.filter(d => d.status === 'processing').length

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 创建知识库（调用 kb-backend API）
  const handleCreateKb = async () => {
    if (!newKbName.trim()) { showMessage('error', '请输入知识库名称'); return }
    if (!newKbDescription.trim()) { showMessage('error', '请输入知识库描述'); return }
    
    // 后端不可用时本地创建
    if (!backendAvailable) {
      const localKb: KnowledgeBase = {
        id: `local-${Date.now()}`,
        name: newKbName.trim(),
        description: newKbDescription.trim(),
        documentCount: 0,
        chunkCount: 0,
        embeddingModel: newKbModel,
        status: 'active',
        totalSize: '0 MB',
        createdBy: 'admin',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      }
      setKbs(prev => [localKb, ...prev])
      setNewKbName('')
      setNewKbDescription('')
      setNewKbModel('bge-large-zh')
      setShowCreateModal(false)
      showMessage('success', `知识库 "${localKb.name}" 创建成功！(本地模式)`)
      return
    }
    
    try {
      const result = await kbApi.create({
        name: newKbName.trim(),
        description: newKbDescription.trim(),
        embedding_model: newKbModel,
      })
      const newKb = mapKbResponse(result as Record<string, unknown>)
      setKbs(prev => [newKb, ...prev])
      setNewKbName('')
      setNewKbDescription('')
      setNewKbModel('bge-large-zh')
      setShowCreateModal(false)
      showMessage('success', `知识库 "${newKb.name}" 创建成功！`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建失败'
      console.error('[KB] 创建知识库失败:', msg)
      showMessage('error', `创建失败: ${msg}`)
    }
  }

  // 查看知识库详情
  const handleViewKb = (kb: KnowledgeBase) => {
    setSelectedKb(kb)
    setShowDetailModal(true)
  }

  // 删除知识库（调用 kb-backend API）
  const handleDeleteKb = async (kb: KnowledgeBase) => {
    if (confirm(`确定要删除知识库 "${kb.name}" 吗？其中的 ${kb.documentCount} 个文档也将被删除！`)) {
      // 后端不可用时本地删除
      if (!backendAvailable) {
        setKbs(prev => prev.filter(k => k.id !== kb.id))
        setDocuments(prev => prev.filter(d => d.kbId !== kb.id))
        showMessage('success', `知识库 "${kb.name}" 已删除 (本地模式)`)
        return
      }
      try {
        await kbApi.delete(kb.id)
        setKbs(prev => prev.filter(k => k.id !== kb.id))
        setDocuments(prev => prev.filter(d => d.kbId !== kb.id))
        showMessage('success', `知识库 "${kb.name}" 及其文档已删除`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : '删除失败'
        console.error('[KB] 删除知识库失败:', msg)
        showMessage('error', `删除失败: ${msg}`)
      }
    }
  }

  // 上传文档
  const handleUploadClick = (kbId?: string) => {
    setUploadTargetKb(kbId || '')
    setUploadFileName('')
    setShowUploadModal(true)
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setUploadFileName(file.name)
  }

  const handleUploadConfirm = async () => {
    if (!uploadFileName) { showMessage('error', '请先选择文件'); return }
    if (!uploadTargetKb) { showMessage('error', '请选择目标知识库'); return }

    setUploading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const targetKb = kbs.find(k => k.id === uploadTargetKb)
    const newDoc: Document = {
      id: Date.now().toString(),
      fileName: uploadFileName,
      fileSize: `${(Math.random() * 10 + 0.5).toFixed(1)} MB`,
      status: 'processing',
      chunkCount: 0,
      kbName: targetKb?.name || '',
      kbId: uploadTargetKb,
      uploadedBy: 'admin',
      createdAt: new Date().toISOString().split('T')[0]
    }
    setDocuments(prev => [newDoc, ...prev])
    setKbs(prev => prev.map(k =>
      k.id === uploadTargetKb
        ? { ...k, documentCount: k.documentCount + 1, updatedAt: new Date().toISOString().split('T')[0] }
        : k
    ))

    setUploading(false)
    setShowUploadModal(false)
    setUploadFileName('')
    setUploadTargetKb('')
    showMessage('success', `文档 "${uploadFileName}" 上传成功，正在处理中...`)

    // 模拟处理完成
    setTimeout(() => {
      const chunks = Math.floor(Math.random() * 50 + 10)
      setDocuments(prev => prev.map(d =>
        d.id === newDoc.id ? { ...d, status: 'completed', chunkCount: chunks } : d
      ))
      setKbs(prev => prev.map(k =>
        k.id === uploadTargetKb ? { ...k, chunkCount: k.chunkCount + chunks } : k
      ))
    }, 3000)
  }

  // 删除文档
  const handleDeleteDoc = (doc: Document) => {
    if (confirm(`确定要删除文档 "${doc.fileName}" 吗？`)) {
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
      setKbs(prev => prev.map(k =>
        k.id === doc.kbId
          ? { ...k, documentCount: Math.max(0, k.documentCount - 1), chunkCount: Math.max(0, k.chunkCount - doc.chunkCount) }
          : k
      ))
      showMessage('success', `文档 "${doc.fileName}" 已删除`)
    }
  }

  // 查看文档详情
  const handleViewDoc = (doc: Document) => {
    setSelectedDoc(doc)
    setShowDocDetailModal(true)
  }

  // 重建索引
  const handleRebuildIndex = async (kb: KnowledgeBase) => {
    setKbs(prev => prev.map(k => k.id === kb.id ? { ...k, status: 'building' } : k))
    showMessage('success', `正在重建 "${kb.name}" 的索引...`)

    await new Promise(resolve => setTimeout(resolve, 3000))

    setKbs(prev => prev.map(k => k.id === kb.id ? { ...k, status: 'active', updatedAt: new Date().toISOString().split('T')[0] } : k))
    showMessage('success', `"${kb.name}" 索引重建完成！`)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    showMessage('success', '已复制到剪贴板')
  }

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

      {/* 后端连接提示（仅在不可用时显示 info 级别） */}
      {!backendAvailable && (
        <div className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg flex items-center gap-2 text-sm">
          <Database className="w-4 h-4 flex-shrink-0" />
          <span>知识库后端未启动，当前为本地演示模式。</span>
          <button onClick={loadKbs} className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline">重试连接</button>
        </div>
      )}

      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知识库</h1>
          <p className="text-gray-500 mt-1">管理和检索您的文档知识</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleUploadClick()}
            className="flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors active:scale-95"
          >
            <Upload className="w-4 h-4" />
            上传文档
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors active:scale-95"
          >
            <Plus className="w-5 h-5" />
            新建知识库
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">知识库总数</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{kbs.length}</p>
            </div>
            <Database className="w-12 h-12 text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">文档数量</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{totalDocs}</p>
            </div>
            <FileText className="w-12 h-12 text-purple-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">分块总数</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{totalChunks}</p>
            </div>
            <BookOpen className="w-12 h-12 text-green-400" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">处理中</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{processingCount}</p>
            </div>
            {processingCount > 0 ? (
              <Loader2 className="w-12 h-12 text-orange-400 animate-spin" />
            ) : (
              <CheckCircle className="w-12 h-12 text-orange-300" />
            )}
          </div>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('kbs')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'kbs' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          知识库列表
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'documents' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          文档管理
        </button>
      </div>

      {/* 内容区 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {activeTab === 'kbs' ? (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索知识库..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <span className="text-sm text-gray-400">共 {filteredKbs.length} 个知识库</span>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin opacity-50" />
                  <p>加载中...</p>
                </div>
              ) : filteredKbs.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无匹配的知识库</p>
                </div>
              ) : (
                filteredKbs.map((kb) => (
                  <div key={kb.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          kb.status === 'active' ? 'bg-blue-100' :
                          kb.status === 'building' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <Database className={`w-6 h-6 ${
                            kb.status === 'active' ? 'text-blue-600' :
                            kb.status === 'building' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{kb.name}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              kb.status === 'active' ? 'bg-green-100 text-green-600' :
                              kb.status === 'building' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {kb.status === 'active' ? '正常' : kb.status === 'building' ? '构建中' : '异常'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{kb.description}</p>
                          <div className="flex gap-4 mt-2 text-xs text-gray-400">
                            <span>{kb.documentCount} 文档</span>
                            <span>{kb.chunkCount} 分块</span>
                            <span>{kb.totalSize}</span>
                            <span>{kb.embeddingModel}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUploadClick(kb.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors active:scale-95"
                        >
                          <Upload className="w-4 h-4" />
                          上传
                        </button>
                        <button
                          onClick={() => handleRebuildIndex(kb)}
                          disabled={kb.status === 'building'}
                          className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            kb.status === 'building' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95'
                          }`}
                        >
                          <Download className="w-4 h-4" />
                          重建索引
                        </button>
                        <button
                          onClick={() => handleViewKb(kb)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95"
                          title="查看详情"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteKb(kb)}
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
                  placeholder="搜索文档..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <span className="text-sm text-gray-400">共 {filteredDocs.length} 个文档</span>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredDocs.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无匹配的文档</p>
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <div key={doc.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          doc.status === 'completed' ? 'bg-green-100' :
                          doc.status === 'processing' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            doc.status === 'completed' ? 'text-green-600' :
                            doc.status === 'processing' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.fileName}</h3>
                          <div className="flex gap-3 mt-1 text-xs text-gray-400">
                            <span className={`px-2 py-0.5 rounded-full ${
                              doc.status === 'completed' ? 'bg-green-100 text-green-600' :
                              doc.status === 'processing' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {doc.status === 'completed' ? '已完成' : doc.status === 'processing' ? '处理中' : '失败'}
                            </span>
                            <span>{doc.fileSize}</span>
                            <span>{doc.chunkCount} 分块</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full">{doc.kbName}</span>
                            <span>{doc.createdAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDoc(doc)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors active:scale-95"
                          title="查看详情"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc)}
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

      {/* 新建知识库弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">新建知识库</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">知识库名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newKbName}
                  onChange={(e) => setNewKbName(e.target.value)}
                  placeholder="例如：技术文档库"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述 <span className="text-red-500">*</span></label>
                <textarea
                  value={newKbDescription}
                  onChange={(e) => setNewKbDescription(e.target.value)}
                  placeholder="请输入知识库描述"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Embedding模型</label>
                <select
                  value={newKbModel}
                  onChange={(e) => setNewKbModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bge-large-zh">bge-large-zh (中文推荐)</option>
                  <option value="text-embedding-ada-002">text-embedding-ada-002 (OpenAI)</option>
                  <option value="text-embedding-3-small">text-embedding-3-small (OpenAI)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowCreateModal(false); setNewKbName(''); setNewKbDescription('') }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={handleCreateKb} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:scale-95">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 知识库详情弹窗 */}
      {showDetailModal && selectedKb && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[560px] shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">知识库详情</h2>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                  selectedKb.status === 'active' ? 'bg-blue-100' :
                  selectedKb.status === 'building' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <Database className={`w-7 h-7 ${
                    selectedKb.status === 'active' ? 'text-blue-600' :
                    selectedKb.status === 'building' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedKb.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      selectedKb.status === 'active' ? 'bg-green-100 text-green-600' :
                      selectedKb.status === 'building' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {selectedKb.status === 'active' ? '正常' : selectedKb.status === 'building' ? '构建中' : '异常'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{selectedKb.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">文档数量</p>
                  <p className="font-semibold text-gray-900">{selectedKb.documentCount} 个</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">分块数量</p>
                  <p className="font-semibold text-gray-900">{selectedKb.chunkCount} 个</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">总大小</p>
                  <p className="font-semibold text-gray-900">{selectedKb.totalSize}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Embedding模型</p>
                  <p className="font-semibold text-gray-900 text-sm">{selectedKb.embeddingModel}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">文档列表</p>
                <div className="space-y-2">
                  {documents.filter(d => d.kbId === selectedKb.id).map(doc => (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${
                          doc.status === 'completed' ? 'text-green-600' :
                          doc.status === 'processing' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">{doc.fileName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          doc.status === 'completed' ? 'bg-green-100 text-green-600' :
                          doc.status === 'processing' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {doc.status === 'completed' ? '已完成' : doc.status === 'processing' ? '处理中' : '失败'}
                        </span>
                        <span className="text-xs text-gray-400">{doc.chunkCount} 分块</span>
                      </div>
                    </div>
                  ))}
                  {documents.filter(d => d.kbId === selectedKb.id).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">暂无文档，点击上传按钮添加</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">创建者：</span><span className="text-gray-900">{selectedKb.createdBy}</span></div>
                <div><span className="text-gray-500">创建时间：</span><span className="text-gray-900">{selectedKb.createdAt}</span></div>
                <div><span className="text-gray-500">更新时间：</span><span className="text-gray-900">{selectedKb.updatedAt}</span></div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">关闭</button>
              <button onClick={() => { setShowDetailModal(false); handleUploadClick(selectedKb.id) }} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors active:scale-95">上传文档</button>
            </div>
          </div>
        </div>
      )}

      {/* 文档详情弹窗 */}
      {showDocDetailModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">文档详情</h2>
              <button onClick={() => setShowDocDetailModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedDoc.status === 'completed' ? 'bg-green-100' :
                  selectedDoc.status === 'processing' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <FileText className={`w-6 h-6 ${
                    selectedDoc.status === 'completed' ? 'text-green-600' :
                    selectedDoc.status === 'processing' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedDoc.fileName}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedDoc.status === 'completed' ? 'bg-green-100 text-green-600' :
                    selectedDoc.status === 'processing' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {selectedDoc.status === 'completed' ? '已完成' : selectedDoc.status === 'processing' ? '处理中' : '失败'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">文件大小</p>
                  <p className="font-semibold text-gray-900">{selectedDoc.fileSize}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">分块数量</p>
                  <p className="font-semibold text-gray-900">{selectedDoc.chunkCount} 个</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">所属知识库</p>
                  <p className="font-semibold text-gray-900">{selectedDoc.kbName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">上传者</p>
                  <p className="font-semibold text-gray-900">{selectedDoc.uploadedBy}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                上传时间：{selectedDoc.createdAt}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDocDetailModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">关闭</button>
              <button onClick={() => { setShowDocDetailModal(false); handleDeleteDoc(selectedDoc) }} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors active:scale-95">删除文档</button>
            </div>
          </div>
        </div>
      )}

      {/* 上传文档弹窗 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[480px] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">上传文档</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">目标知识库 <span className="text-red-500">*</span></label>
                <select
                  value={uploadTargetKb}
                  onChange={(e) => setUploadTargetKb(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择知识库</option>
                  {kbs.filter(k => k.status === 'active').map(kb => (
                    <option key={kb.id} value={kb.id}>{kb.name}</option>
                  ))}
                </select>
              </div>
              <div
                onClick={handleFileSelect}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">点击选择文件或拖拽到此处</p>
                <p className="text-xs text-gray-400 mt-2">支持 PDF, DOCX, TXT, MD 文件</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              {uploadFileName && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{uploadFileName}</span>
                  <CheckCircle className="w-4 h-4 ml-auto" />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowUploadModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
              <button
                onClick={handleUploadConfirm}
                disabled={!uploadFileName || !uploadTargetKb || uploading}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  uploadFileName && uploadTargetKb && !uploading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {uploading ? '上传中...' : '确认上传'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
