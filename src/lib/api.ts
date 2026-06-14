// 使用相对路径 /api/v1，通过 Next.js rewrites 代理到本地后端
// 本地开发和内网穿透/公网部署均正常工作
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const getAuthToken = () => {
  return localStorage.getItem('apiKey') || '';
};

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return response.json();
    },
    register: async (email: string, password: string, name: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      return response.json();
    }
  },

  apiKeys: {
    list: async () => {
      const response = await fetch(`${API_BASE_URL}/api-keys`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    },
    create: async (name: string, maxRequests: number = 1000) => {
      const response = await fetch(`${API_BASE_URL}/api-keys`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ name, max_requests: maxRequests })
      });
      return response.json();
    },
    delete: async (keyId: string) => {
      const response = await fetch(`${API_BASE_URL}/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    }
  },

  models: {
    list: async () => {
      const response = await fetch(`${API_BASE_URL}/models`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    },
    chat: async (model: string, messages: { role: string; content: string | any[] }[], opts?: { temperature?: number }) => {
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ model, messages, ...(opts || {}) })
      });
      return response.json();
    }
  },

  billing: {
    balance: async () => {
      const response = await fetch(`${API_BASE_URL}/balance`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    },
    topup: async (amount: number) => {
      const response = await fetch(`${API_BASE_URL}/balance/topup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ amount })
      });
      return response.json();
    },
    usage: async (startDate?: string, endDate?: string) => {
      let url = `${API_BASE_URL}/usage`;
      if (startDate || endDate) {
        url += '?';
        if (startDate) url += `start_date=${startDate}`;
        if (endDate) url += `${startDate ? '&' : ''}end_date=${endDate}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    }
  },

  admin: {
    stats: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    },
    users: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    },
    createUser: async (data: { email: string; password: string; name: string; balance?: number }) => {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    updateUser: async (userId: string, data: { email?: string; name?: string; balance?: number }) => {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    deleteUser: async (userId: string) => {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return response.json();
    },
    callLogs: async (filter?: { user_id?: string; model_alias?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (filter?.user_id) params.set('user_id', filter.user_id);
      if (filter?.model_alias) params.set('model_alias', filter.model_alias);
      if (filter?.limit) params.set('limit', String(filter.limit));
      const url = `${API_BASE_URL}/admin/call-logs?${params.toString()}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    },
    // 厂商配置管理
    vendors: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/vendor-configs`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    },
    updateVendor: async (vendorId: string, data: { api_key?: string; api_secret?: string; api_base_url?: string; status?: string }) => {
      const response = await fetch(`${API_BASE_URL}/admin/vendor-configs/${vendorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    // 模型映射（定价）管理
    modelMappings: async () => {
      const response = await fetch(`${API_BASE_URL}/admin/model-mappings`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    },
    createModelMapping: async (data: { alias: string; vendor_id: string; vendor_model_id: string; input_price?: number; output_price?: number; status?: string }) => {
      const response = await fetch(`${API_BASE_URL}/admin/model-mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    updateModelMapping: async (id: string, data: { input_price?: number; output_price?: number; status?: string }) => {
      const response = await fetch(`${API_BASE_URL}/admin/model-mappings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    deleteModelMapping: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/admin/model-mappings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      return response.json();
    },
  },

  // 节点健康监控
  nodes: {
    health: async () => {
      const response = await fetch(`${API_BASE_URL}/nodes/health`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      return response.json();
    }
  }
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('apiKey', token);
};

export const clearAuthToken = () => {
  localStorage.removeItem('apiKey');
};

// =============================================
// Python 后端服务 API 客户端
// =============================================

const KB_API_URL = process.env.NEXT_PUBLIC_KB_API_URL || 'http://localhost:8002/api/v1';
const SKILL_API_URL = process.env.NEXT_PUBLIC_SKILL_API_URL || 'http://localhost:8001/api';
const MCP_API_URL = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:8003';

// 知识库服务认证 Key（开发环境默认值）
const KB_API_KEY = process.env.NEXT_PUBLIC_KB_API_KEY || 'kb-api-key-123';
// 技能库服务认证 Key（开发环境默认值）
const SKILL_API_KEY = process.env.NEXT_PUBLIC_SKILL_API_KEY || 'skill-admin-key-123';
// MCP 服务认证 Key（开发环境默认值）
const MCP_API_KEY = process.env.NEXT_PUBLIC_MCP_API_KEY || 'mcp-api-key-123';

/** 知识库 API */
export const kbApi = {
  /** 获取知识库列表 */
  list: async (page = 1, pageSize = 50) => {
    const response = await fetch(
      `${KB_API_URL}/kbs?page=${page}&page_size=${pageSize}`,
      { headers: { 'X-API-Key': KB_API_KEY } }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `获取知识库列表失败: ${response.status}`);
    }
    return response.json();
  },

  /** 创建知识库 */
  create: async (data: { name: string; description?: string; embedding_model?: string }) => {
    const response = await fetch(`${KB_API_URL}/kbs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': KB_API_KEY },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `创建知识库失败: ${response.status}`);
    }
    return response.json();
  },

  /** 删除知识库 */
  delete: async (id: string) => {
    const response = await fetch(`${KB_API_URL}/kbs/${id}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': KB_API_KEY },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `删除知识库失败: ${response.status}`);
    }
    return response.json();
  },

  /** 获取知识库详情 */
  getStats: async (id: string) => {
    const response = await fetch(`${KB_API_URL}/kbs/${id}`, {
      headers: { 'X-API-Key': KB_API_KEY },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `获取知识库详情失败: ${response.status}`);
    }
    return response.json();
  },

  /** 搜索知识库 */
  search: async (id: string, query: string) => {
    const response = await fetch(`${KB_API_URL}/kbs/${id}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': KB_API_KEY },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `搜索失败: ${response.status}`);
    }
    return response.json();
  },
};

/** 技能库 API */
export const skillApi = {
  /** 获取技能列表 */
  list: async (page = 1, pageSize = 50) => {
    const response = await fetch(
      `${SKILL_API_URL}/skills?page=${page}&page_size=${pageSize}`,
      { headers: { 'X-API-Key': SKILL_API_KEY } }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `获取技能列表失败: ${response.status}`);
    }
    return response.json();
  },

  /** 创建技能 */
  create: async (data: { name: string; description?: string; version?: string; params_schema?: object; created_by: string }) => {
    const response = await fetch(`${SKILL_API_URL}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': SKILL_API_KEY },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `创建技能失败: ${response.status}`);
    }
    return response.json();
  },

  /** 更新技能信息 */
  update: async (id: string, data: { name?: string; description?: string; version?: string; params_schema?: object }) => {
    const response = await fetch(`${SKILL_API_URL}/skills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': SKILL_API_KEY },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `更新技能失败: ${response.status}`);
    }
    return response.json();
  },

  /** 更新技能状态（上下线） */
  updateStatus: async (id: string, status: 'draft' | 'online' | 'offline') => {
    const response = await fetch(`${SKILL_API_URL}/skills/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': SKILL_API_KEY },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `更新技能状态失败: ${response.status}`);
    }
    return response.json();
  },

  /** 删除技能 */
  delete: async (id: string) => {
    const response = await fetch(`${SKILL_API_URL}/skills/${id}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': SKILL_API_KEY },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `删除技能失败: ${response.status}`);
    }
    return response.json();
  },
};

/** MCP 服务器 API */
export const mcpApi = {
  /** 获取 MCP Server 列表 */
  list: async (page = 1, pageSize = 50) => {
    const response = await fetch(
      `${MCP_API_URL}/mcp/servers?page=${page}&page_size=${pageSize}`,
      { headers: { 'X-API-Key': MCP_API_KEY } }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `获取 MCP 列表失败: ${response.status}`);
    }
    return response.json();
  },

  /** 创建 MCP Server */
  create: async (data: { name: string; server_url: string; auth_type?: string; description?: string; timeout?: number }) => {
    const response = await fetch(`${MCP_API_URL}/mcp/servers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': MCP_API_KEY },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `创建 MCP 失败: ${response.status}`);
    }
    return response.json();
  },

  /** 更新 MCP Server */
  update: async (id: string, data: { name?: string; server_url?: string; status?: string }) => {
    const response = await fetch(`${MCP_API_URL}/mcp/servers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': MCP_API_KEY },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `更新 MCP 失败: ${response.status}`);
    }
    return response.json();
  },

  /** 删除 MCP Server */
  delete: async (id: string) => {
    const response = await fetch(`${MCP_API_URL}/mcp/servers/${id}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': MCP_API_KEY },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `删除 MCP 失败: ${response.status}`);
    }
    return response.json();
  },
};

