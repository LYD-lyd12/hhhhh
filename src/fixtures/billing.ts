export interface BillingRecord {
  id: string
  date: string
  model: string
  inputTokens: number
  outputTokens: number
  totalCost: number
  status: 'completed' | 'pending'
}

export interface UserBalance {
  total: number
  used: number
  remaining: number
  currency: string
}

export const billingRecords: BillingRecord[] = [
  { id: '1', date: '2024-01-15 10:30', model: 'doubao-3.5-turbo', inputTokens: 2500, outputTokens: 5200, totalCost: 0.01615, status: 'completed' },
  { id: '2', date: '2024-01-15 10:25', model: 'chatglm-6b', inputTokens: 1800, outputTokens: 3200, totalCost: 0.005, status: 'completed' },
  { id: '3', date: '2024-01-15 10:20', model: 'qwen-7b-chat', inputTokens: 3200, outputTokens: 6800, totalCost: 0.012, status: 'completed' },
  { id: '4', date: '2024-01-15 10:15', model: 'text-embedding-ada-002', inputTokens: 15000, outputTokens: 0, totalCost: 0.0075, status: 'completed' },
  { id: '5', date: '2024-01-15 10:10', model: 'doubao-3.5-turbo', inputTokens: 1800, outputTokens: 4200, totalCost: 0.0123, status: 'completed' },
]

export const userBalance: UserBalance = {
  total: 1000.00,
  used: 356.78,
  remaining: 643.22,
  currency: 'CNY'
}

export const monthlyUsage = [
  { month: '8月', usage: 125000, cost: 187.5 },
  { month: '9月', usage: 180000, cost: 270.0 },
  { month: '10月', usage: 220000, cost: 330.0 },
  { month: '11月', usage: 195000, cost: 292.5 },
  { month: '12月', usage: 280000, cost: 420.0 },
  { month: '1月', usage: 310000, cost: 465.0 },
]
