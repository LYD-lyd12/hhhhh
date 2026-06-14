import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Edit, Trash2, User, X, DollarSign } from 'lucide-react'
import { api } from '@/lib/api'

interface UserRecord {
  id: string
  name: string
  email: string
  balance: number
  created_at: string
}

type DialogMode = 'none' | 'add' | 'edit' | 'delete' | 'topup'

export default function Users() {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [dialogMode, setDialogMode] = useState<DialogMode>('none')
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formBalance, setFormBalance] = useState('')
  const [topupAmount, setTopupAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.admin.users()
      if (res.data && Array.isArray(res.data)) {
        setUsers(res.data)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ─── Dialog helpers ───────────────────────────────────
  const openDialog = (mode: DialogMode, user?: UserRecord) => {
    setError('')
    if (user) setSelectedUser(user)
    else setSelectedUser(null)

    if (mode === 'add') {
      setFormName(''); setFormEmail(''); setFormPassword(''); setFormBalance('10')
      setDialogMode('add')
    } else if (mode === 'edit' && user) {
      setFormName(user.name); setFormEmail(user.email); setFormPassword(''); setFormBalance(String(user.balance))
      setDialogMode('edit')
    } else if (mode === 'delete' && user) {
      setDialogMode('delete')
    } else if (mode === 'topup' && user) {
      setTopupAmount('')
      setDialogMode('topup')
    }
  }

  const closeDialog = () => {
    setDialogMode('none')
    setError('')
  }

  // ─── CRUD handlers ────────────────────────────────────
  const handleAdd = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword) {
      setError('请填写用户名、邮箱和密码')
      return
    }
    if (formPassword.length < 6) {
      setError('密码长度至少 6 位')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.admin.createUser({
        email: formEmail.trim(),
        password: formPassword,
        name: formName.trim(),
        balance: Number(formBalance) || 0,
      })
      if (res.error) {
        setError(res.error)
      } else {
        closeDialog()
        await fetchUsers()
      }
    } catch (err) {
      setError('创建失败，请检查网络')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedUser) return
    if (!formName.trim()) {
      setError('请输入用户名')
      return
    }
    setSubmitting(true)
    try {
      const data: any = { name: formName.trim(), balance: Number(formBalance) || 0 }
      // 只有邮箱变化时才传
      if (formEmail.trim() !== selectedUser.email) {
        data.email = formEmail.trim()
      }
      const res = await api.admin.updateUser(selectedUser.id, data)
      if (res.error) {
        setError(res.error)
      } else {
        closeDialog()
        await fetchUsers()
      }
    } catch (err) {
      setError('更新失败，请检查网络')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await api.admin.deleteUser(selectedUser.id)
      if (res.error) {
        setError(res.error)
      } else {
        closeDialog()
        await fetchUsers()
      }
    } catch (err) {
      setError('删除失败，请检查网络')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTopup = async () => {
    if (!selectedUser) return
    const amount = Number(topupAmount)
    if (!amount || amount <= 0) {
      setError('请输入有效的充值金额')
      return
    }
    setSubmitting(true)
    try {
      const newBalance = selectedUser.balance + amount
      const res = await api.admin.updateUser(selectedUser.id, { balance: newBalance })
      if (res.error) {
        setError(res.error)
      } else {
        closeDialog()
        await fetchUsers()
      }
    } catch (err) {
      setError('充值失败，请检查网络')
    } finally {
      setSubmitting(false)
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
          <h1 className="text-2xl font-bold text-slate-800">用户管理</h1>
          <p className="text-slate-500 mt-1">管理平台用户和余额</p>
        </div>
        <button
          onClick={() => openDialog('add')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加用户
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索用户名或邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">用户信息</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">余额</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">创建时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-slate-800">¥{user.balance.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {user.created_at?.replace('T', ' ').substring(0, 19) || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openDialog('topup', user)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="充值"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDialog('edit', user)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDialog('delete', user)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between py-2">
        <p className="text-sm text-slate-500">共 {filteredUsers.length} 条记录</p>
      </div>

      {/* ─── Modal Overlay ──────────────────────────────────── */}
      {dialogMode !== 'none' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeDialog}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {dialogMode === 'add' && '添加用户'}
                {dialogMode === 'edit' && '编辑用户'}
                {dialogMode === 'delete' && '删除用户'}
                {dialogMode === 'topup' && '余额充值'}
              </h2>
              <button onClick={closeDialog} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {/* Delete confirmation */}
            {dialogMode === 'delete' && selectedUser && (
              <>
                <p className="text-slate-600 mb-6">
                  确定要删除用户 <span className="font-semibold text-slate-800">{selectedUser.name}</span>（{selectedUser.email}）吗？此操作不可撤销。
                </p>
                <div className="flex gap-3 justify-end">
                  <button onClick={closeDialog} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                    取消
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={submitting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-red-400"
                  >
                    {submitting ? '删除中...' : '确认删除'}
                  </button>
                </div>
              </>
            )}

            {/* Topup */}
            {dialogMode === 'topup' && selectedUser && (
              <>
                <p className="text-sm text-slate-600 mb-2">
                  用户：<span className="font-semibold">{selectedUser.name}</span>，
                  当前余额：<span className="font-semibold text-green-600">¥{selectedUser.balance.toFixed(2)}</span>
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">充值金额</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="输入充值金额"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <button onClick={closeDialog} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                    取消
                  </button>
                  <button
                    onClick={handleTopup}
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-green-400"
                  >
                    {submitting ? '充值中...' : '确认充值'}
                  </button>
                </div>
              </>
            )}

            {/* Add / Edit form */}
            {(dialogMode === 'add' || dialogMode === 'edit') && (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">用户名 *</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="输入用户名"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">邮箱 *</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  {dialogMode === 'add' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">密码 *</label>
                      <input
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="至少 6 位密码"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">初始余额</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formBalance}
                      onChange={(e) => setFormBalance(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <button onClick={closeDialog} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                    取消
                  </button>
                  <button
                    onClick={dialogMode === 'add' ? handleAdd : handleEdit}
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:bg-primary-400"
                  >
                    {submitting ? '保存中...' : '保存'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
