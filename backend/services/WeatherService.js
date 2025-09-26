const axios = require('axios');

class WeatherService {
  constructor() {
    this.weatherEffects = {
      'rain': {
        npcDensity: 0.7,
        gossipSpread: 0.8,
        guardVisibility: 0.6
      },
      'clear': {
        npcDensity: 1.0,
        gossipSpread: 1.0,
        guardVisibility: 1.0
      },
      'hot': {
        npcDensity: 0.8,
        gossipSpread: 1.2,
        guardVisibility: 0.9
      },
      'cold': {
        npcDensity: 0.6,
        gossipSpread: 0.7,
        guardVisibility: 1.1
      }
    };
    this.currentWeather = null;
    this.lastUpdate = 0;
    this.updateInterval = 30 * 60 * 1000; // 30 minutes
  }

  async updateWeather(location = 'Athens,Greece') {
    const now = Date.now();
    if (this.currentWeather && (now - this.lastUpdate) < this.updateInterval) {
      return this.currentWeather;
    }

    try {
      // This would be implemented if we want server-side weather integration
      // For now, weather effects are handled client-side
      const weatherType = this.determineWeatherType(22); // Default temperature
      this.currentWeather = {
        type: weatherType,
        temperature: 22,
        timestamp: now
      };
      this.lastUpdate = now;
      
      return this.currentWeather;
    } catch (error) {
      console.error('Weather update failed:', error);
      return this.currentWeather || { type: 'clear', temperature: 22, timestamp: now };
    }
  }

  determineWeatherType(temperature) {
    if (temperature >= 30) return 'hot';
    if (temperature < 15) return 'cold';
    return 'clear';
  }

  getWeatherEffects(weatherType = 'clear') {
    return this.weatherEffects[weatherType] || this.weatherEffects['clear'];
  }
}

module.exports = new WeatherService();