const fs = require('fs');
const path = require('path');

class SkillExecutor {
  constructor() {
    this.skillCache = new Map();
  }

  async loadSkill(skillId, codePath) {
    if (this.skillCache.has(skillId)) {
      return this.skillCache.get(skillId);
    }

    try {
      if (!codePath || !fs.existsSync(codePath)) {
        throw new Error(`Skill code not found: ${codePath}`);
      }

      const code = fs.readFileSync(codePath, 'utf-8');
      const skillModule = this.compileSkill(code);
      
      this.skillCache.set(skillId, skillModule);
      return skillModule;
    } catch (error) {
      console.error(`Failed to load skill ${skillId}:`, error);
      throw error;
    }
  }

  compileSkill(code) {
    const wrapper = `
      (function() {
        const module = { exports: {} };
        const exports = module.exports;
        ${code}
        return module.exports;
      })()
    `;
    
    try {
      return eval(wrapper);
    } catch (error) {
      throw new Error(`Skill compilation error: ${error.message}`);
    }
  }

  async executeSkill(skillId, codePath, params) {
    const skillModule = await this.loadSkill(skillId, codePath);
    
    if (typeof skillModule.execute !== 'function') {
      throw new Error('Skill must export an execute function');
    }

    try {
      const result = await skillModule.execute(params);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getToolDescriptions(db) {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, name, description, params_schema, status FROM skills WHERE status = "online"', [], (err, rows) => {
        if (err) return reject(err);
        
        const tools = rows.map(row => ({
          type: 'function',
          function: {
            name: row.name.toLowerCase().replace(/\s+/g, '-'),
            description: row.description || 'No description',
            parameters: row.params_schema || {
              type: 'object',
              properties: {},
              required: []
            }
          }
        }));
        
        resolve(tools);
      });
    });
  }

  invalidateCache(skillId) {
    this.skillCache.delete(skillId);
  }
}

module.exports = new SkillExecutor();
