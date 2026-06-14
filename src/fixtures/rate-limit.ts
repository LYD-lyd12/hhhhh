export interface RateLimitRule {
  id: string
  name: string
  type: 'user' | 'app' | 'system' | 'model'
  limitType: 'qps' | 'tpm' | 'daily'
  value: number
  status: 'active' | 'inactive'
  description: string
}

export const rateLimitRules: RateLimitRule[] = [
  { id: '1', name: '用户基础QPS限制', type: 'user', limitType: 'qps', value: 10, status: 'active', description: '单个用户每秒最大请求数' },
  { id: '2', name: '用户每日限额', type: 'user', limitType: 'daily', value: 10000, status: 'active', description: '单个用户每日最大请求数' },
  { id: '3', name: '应用QPS限制', type: 'app', limitType: 'qps', value: 50, status: 'active', description: '单个应用每秒最大请求数' },
  { id: '4', name: '系统总QPS限制', type: 'system', limitType: 'qps', value: 1000, status: 'active', description: '系统总请求数上限' },
  { id: '5', name: '豆包模型TPM限制', type: 'model', limitType: 'tpm', value: 500, status: 'active', description: '豆包模型每分钟请求数限制' },
]
