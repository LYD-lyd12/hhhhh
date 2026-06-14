'use client'

import { useState } from 'react'
import { Lock, Mail, Eye, EyeOff, LogIn, UserPlus, User } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }

    if (isRegister && !name.trim()) {
      setError('请输入用户名')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('两次密码不一致')
      return
    }

    if (isRegister && password.length < 6) {
      setError('密码长度至少 6 位')
      return
    }

    setIsLoading(true)

    try {
      if (isRegister) {
        // 注册
        const res = await api.auth.register(email, password, name.trim())
        if (res.id) {
          setSuccess('注册成功！正在自动登录...')
          // 注册成功后自动登录
          const loginSuccess = await login(email, password)
          if (!loginSuccess) {
            setError('注册成功但自动登录失败，请手动登录')
            setIsRegister(false)
          }
        } else {
          setError(res.error || '注册失败，请稍后重试')
        }
      } else {
        // 登录
        const success = await login(email, password)
        if (!success) {
          setError('邮箱或密码错误')
        }
      }
    } catch (err) {
      setError(isRegister ? '注册失败，请检查网络' : '登录失败，请检查网络')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsRegister(!isRegister)
    setError('')
    setSuccess('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            {isRegister ? (
              <UserPlus className="w-8 h-8 text-white" />
            ) : (
              <Lock className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">翼站Token超市</h1>
          <p className="text-primary-100">
            {isRegister ? '创建您的账户' : '欢迎登录您的账户'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error / Success messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Name — registration only */}
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="您的用户名"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isRegister ? 'your@email.com' : 'admin@teletoken.io'}
                    data-testid="login-email"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  data-testid="login-password"
                  className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password — registration only */}
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {/* Remember me / forgot password — login only */}
            {!isRegister && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                  <span className="text-sm text-slate-600">记住我</span>
                </label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">忘记密码?</a>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              data-testid="login-submit"
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isRegister ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isLoading ? (isRegister ? '注册中...' : '登录中...') : (isRegister ? '注册' : '登录')}
            </button>
          </form>

          {/* Mode Toggle */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-center text-sm text-slate-600">
              {isRegister ? '已有账户? ' : '还没有账户? '}
              <button
                onClick={toggleMode}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {isRegister ? '立即登录' : '立即注册'}
              </button>
            </p>
          </div>

          {/* Test account hint — login only */}
          {!isRegister && (
            <div className="mt-4">
              <p className="text-center text-xs text-slate-500">
                测试账号: admin@teletoken.io / admin123
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
