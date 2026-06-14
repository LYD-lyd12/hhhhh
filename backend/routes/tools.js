const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const skillExecutor = require('../services/skill_executor');
const db = require('../database');

router.get('/tools', authenticate, async (req, res) => {
  try {
    const tools = await skillExecutor.getToolDescriptions(db);
    res.json({ data: tools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tools/call', authenticate, async (req, res) => {
  const { tool_name, params } = req.body;

  if (!tool_name) {
    return res.status(400).json({ error: 'tool_name is required' });
  }

  db.get('SELECT * FROM skills WHERE name = ? AND status = "online"', [tool_name], async (err, skill) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!skill) {
      return res.status(404).json({ error: `Skill "${tool_name}" not found or not online` });
    }

    try {
      const result = await skillExecutor.executeSkill(skill.id, skill.code_path, params || {});
      
      res.json({
        success: result.success,
        data: result.success ? result.result : null,
        error: result.success ? null : result.error,
        skill_name: tool_name,
        executed_at: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

router.post('/chat-with-tools', authenticate, async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages is required' });
  }

  try {
    const tools = await skillExecutor.getToolDescriptions(db);
    
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    const toolCall = await simulateToolSelection(tools, userQuery);

    if (toolCall) {
      const { tool_name, tool_params } = toolCall;
      
      const toolResult = await callTool(tool_name, tool_params);
      
      const finalResponse = {
        id: `chat-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: 'teletoken-tool-agent',
        choices: [{
          message: {
            role: 'assistant',
            content: `根据工具调用结果：\n\n${JSON.stringify(toolResult.data, null, 2)}`,
            tool_calls: [{
              id: `tool_call_${Date.now()}`,
              type: 'function',
              function: {
                name: tool_name,
                arguments: tool_params
              }
            }]
          },
          finish_reason: 'tool_call'
        }],
        tool_results: [toolResult]
      };

      res.json(finalResponse);
    } else {
      res.json({
        id: `chat-${Date.now()}`,
        object: 'chat.completion',
        created: Date.now(),
        model: 'teletoken-tool-agent',
        choices: [{
          message: {
            role: 'assistant',
            content: '这是一个普通的对话问题，不需要调用工具。'
          },
          finish_reason: 'stop'
        }]
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function simulateToolSelection(tools, userQuery) {
  const toolKeywords = {
    'weather': ['天气', '温度', '气温', '晴', '雨', '雪', '风'],
    'stock': ['股票', '股价', '行情', '涨', '跌'],
    'translate': ['翻译', '英文', '日语', '韩语', '中文']
  };

  for (const tool of tools) {
    const toolName = tool.function.name;
    const keywords = toolKeywords[toolName] || [];
    
    if (keywords.some(keyword => userQuery.includes(keyword))) {
      const params = extractParams(userQuery, tool.function.parameters);
      return { tool_name: tool.function.name, tool_params: params };
    }
  }

  if (tools.length > 0 && userQuery.includes('查询')) {
    return { tool_name: tools[0].function.name, tool_params: extractParams(userQuery, tools[0].function.parameters) };
  }

  return null;
}

function extractParams(query, paramsSchema) {
  const params = {};
  const properties = paramsSchema.properties || {};
  
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.description) {
      const keywords = prop.description.split('、');
      for (const keyword of keywords) {
        const regex = new RegExp(`(${keyword})[：:]?\\s*([\\u4e00-\\u9fa5a-zA-Z0-9]+)`);
        const match = query.match(regex);
        if (match) {
          params[key] = match[2];
          break;
        }
      }
    }
  }

  return params;
}

async function callTool(toolName, params) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM skills WHERE name = ? AND status = "online"', [toolName], async (err, skill) => {
      if (err) return reject(err);
      if (!skill) return resolve({ success: false, error: 'Skill not found' });

      try {
        const result = await skillExecutor.executeSkill(skill.id, skill.code_path, params);
        resolve(result);
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  });
}

module.exports = router;
