exports.execute = async function(params) {
  const { city } = params;
  
  if (!city) {
    throw new Error('请提供城市名称');
  }

  const weatherData = {
    '北京': { temperature: '25°C', condition: '晴', humidity: '45%', wind: '东北风3级' },
    '上海': { temperature: '28°C', condition: '多云', humidity: '60%', wind: '东南风2级' },
    '广州': { temperature: '32°C', condition: '雷阵雨', humidity: '85%', wind: '南风4级' },
    '深圳': { temperature: '30°C', condition: '多云转晴', humidity: '70%', wind: '东风2级' },
    '杭州': { temperature: '26°C', condition: '阴', humidity: '55%', wind: '西北风3级' }
  };

  const data = weatherData[city] || { temperature: '未知', condition: '未查询到', humidity: '未知', wind: '未知' };

  return {
    city: city,
    temperature: data.temperature,
    condition: data.condition,
    humidity: data.humidity,
    wind: data.wind,
    report_time: new Date().toLocaleString('zh-CN')
  };
};
