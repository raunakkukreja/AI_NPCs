// frontend/src/services/WeatherService.js

class WeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    this.testMode = import.meta.env.VITE_WEATHER_TEST_MODE === 'true';
    this.testTemperature = parseFloat(import.meta.env.VITE_TEST_TEMPERATURE) || 25;
    this.testCondition = import.meta.env.VITE_TEST_CONDITION || 'clear';
    this.testHumidity = 50;
    this.testWindSpeed = 10;
    this.cachedWeather = null;
    this.lastFetchTime = 0;
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  async getCurrentWeatherData(location = 'Athens,Greece') {
    // If in test mode, return test data
    if (this.testMode) {
      const testData = {
        temperature: this.testTemperature,
        condition: this.testCondition || 'clear',
        humidity: this.testHumidity || 50,
        windSpeed: this.testWindSpeed || 10
      };
      console.log('[WeatherService] Test mode enabled, returning test data:', testData);
      return testData;
    }

    // Check cache first
    const now = Date.now();
    if (this.cachedWeather && (now - this.lastFetchTime) < this.cacheExpiry) {
      console.log('[WeatherService] Returning cached weather data:', this.cachedWeather);
      return this.cachedWeather;
    }

    try {
      if (!this.apiKey || this.apiKey === 'your_weatherapi_key_here') {
        console.warn('[WeatherService] No valid API key found, using default weather');
        return { temperature: 22, condition: 'clear', humidity: 50, windSpeed: 10 };
      }

      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${location}`
      );

      if (!response.ok) {
        throw new Error(`Weather API request failed: ${response.status}`);
      }

      const data = await response.json();
      const weatherData = {
        temperature: data.current.temp_c,
        condition: this.normalizeWeatherCondition(data.current.condition.text.toLowerCase()),
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        rawCondition: data.current.condition.text
      };
      
      // Cache the result
      this.cachedWeather = weatherData;
      this.lastFetchTime = now;
      
      console.log('[WeatherService] Fetched weather data:', weatherData);
      return weatherData;
    } catch (error) {
      console.error('[WeatherService] Error fetching weather:', error);
      // Return default weather on error
      return { temperature: 22, condition: 'clear', humidity: 50, windSpeed: 10 };
    }
  }

  async getCurrentTemperature(location = 'Athens,Greece') {
    const weatherData = await this.getCurrentWeatherData(location);
    return weatherData.temperature;
  }

  /**
   * Normalize weather condition text from API to standard conditions
   * @param {string} conditionText - Raw condition text from API
   * @returns {string} Normalized condition
   */
  normalizeWeatherCondition(conditionText) {
    const condition = conditionText.toLowerCase();
    
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
      return 'rain';
    } else if (condition.includes('snow') || condition.includes('blizzard') || condition.includes('sleet')) {
      return 'snow';
    } else if (condition.includes('fog') || condition.includes('mist')) {
      return 'fog';
    } else if (condition.includes('overcast')) {
      return 'overcast';
    } else if (condition.includes('cloud') || condition.includes('partly cloudy')) {
      return 'cloudy';
    } else if (condition.includes('thunder') || condition.includes('storm')) {
      return 'storm';
    } else if (condition.includes('clear') || condition.includes('sunny')) {
      return 'clear';
    } else {
      return 'clear'; // Default fallback
    }
  }

  /**
   * Calculate weather visual effects based on temperature and conditions
   * @param {object} weatherData - Weather data object with temperature and condition
   * @returns {object} Visual effect properties
   */
  getWeatherEffects(weatherData) {
    // Handle backward compatibility - if just temperature passed
    if (typeof weatherData === 'number') {
      weatherData = { temperature: weatherData, condition: 'clear' };
    }

    const { temperature, condition = 'clear', humidity = 50, windSpeed = 10 } = weatherData;
    
    const effects = {
      temperature,
      condition,
      humidity,
      windSpeed,
      isCold: temperature < 25,
      isHot: temperature >= 25,
      intensity: 0.5,
      animations: [],
      description: `${condition} weather`
    };

    // Base temperature effects
    let baseFilter = '';
    let baseOverlay = 'rgba(0, 0, 0, 0)';

    if (temperature >= 35) {
      baseFilter = 'brightness(1.4) saturate(1.3) sepia(0.3) hue-rotate(10deg)';
      baseOverlay = 'rgba(255, 215, 0, 0.15)';
    } else if (temperature >= 30) {
      baseFilter = 'brightness(1.3) saturate(1.2) sepia(0.2) hue-rotate(5deg)';
      baseOverlay = 'rgba(255, 235, 59, 0.12)';
    } else if (temperature >= 25) {
      baseFilter = 'brightness(1.15) saturate(1.1) sepia(0.1)';
      baseOverlay = 'rgba(255, 245, 157, 0.08)';
    } else if (temperature >= 15) {
      baseFilter = 'brightness(0.95) saturate(0.95) hue-rotate(-5deg)';
      baseOverlay = 'rgba(173, 216, 230, 0.05)';
    } else if (temperature >= 5) {
      baseFilter = 'brightness(0.85) saturate(0.8) hue-rotate(-10deg) contrast(0.95)';
      baseOverlay = 'rgba(135, 206, 250, 0.1)';
    } else {
      baseFilter = 'brightness(0.75) saturate(0.6) hue-rotate(-15deg) contrast(0.9)';
      baseOverlay = 'rgba(70, 130, 180, 0.15)';
    }

    // Apply condition-specific effects
    switch (condition) {
      case 'rain':
        effects.filter = baseFilter + ' brightness(0.7) contrast(1.1)';
        effects.overlay = this.blendColors(baseOverlay, 'rgba(70, 130, 180, 0.2)');
        effects.animations = ['rain'];
        effects.intensity = 0.8;
        effects.description = 'rainy weather';
        break;

      case 'snow':
        effects.filter = baseFilter + ' brightness(1.2) saturate(0.3) contrast(1.3)';
        effects.overlay = this.blendColors(baseOverlay, 'rgba(240, 248, 255, 0.3)');
        effects.animations = ['snow'];
        effects.intensity = 0.9;
        effects.description = 'snowy weather';
        break;

      case 'fog':
        effects.filter = baseFilter + ' brightness(0.8) saturate(0.5) blur(0.5px)';
        effects.overlay = this.blendColors(baseOverlay, 'rgba(220, 220, 220, 0.4)');
        effects.animations = ['fog'];
        effects.intensity = 0.7;
        effects.description = 'foggy weather';
        break;

      case 'overcast':
        effects.filter = baseFilter + ' brightness(0.75) saturate(0.8) contrast(0.9)';
        effects.overlay = this.blendColors(baseOverlay, 'rgba(128, 128, 128, 0.25)');
        effects.intensity = 0.6;
        effects.description = 'overcast weather';
        break;

      case 'cloudy':
        effects.filter = baseFilter + ' brightness(0.9) saturate(0.9)';
        effects.overlay = this.blendColors(baseOverlay, 'rgba(176, 196, 222, 0.15)');
        effects.animations = ['clouds'];
        effects.intensity = 0.4;
        effects.description = 'cloudy weather';
        break;

      case 'storm':
        effects.filter = baseFilter + ' brightness(0.6) saturate(1.2) contrast(1.4)';
        effects.overlay = this.blendColors(baseOverlay, 'rgba(75, 0, 130, 0.3)');
        effects.animations = ['rain', 'lightning'];
        effects.intensity = 1.0;
        effects.description = 'stormy weather';
        break;

      case 'clear':
      default:
        effects.filter = baseFilter;
        effects.overlay = baseOverlay;
        effects.intensity = Math.abs(temperature - 22) / 30; // Base intensity on temperature deviation
        effects.description = temperature >= 25 ? 'clear and warm' : 'clear and cool';
        break;
    }

    return effects;
  }

  /**
   * Blend two rgba color strings
   * @param {string} color1 - First rgba color
   * @param {string} color2 - Second rgba color
   * @returns {string} Blended rgba color
   */
  blendColors(color1, color2) {
    // Simple color blending - in practice, you might want more sophisticated blending
    // For now, just return the second color as dominant overlay
    return color2;
  }

  /**
   * Enable test mode with specific temperature
   * @param {number} temperature - Test temperature in Celsius
   */
  setTestTemperature(temperature) {
    this.testMode = true;
    this.testTemperature = temperature;
    console.log('[WeatherService] Test mode enabled with temperature:', temperature);
  }

  /**
   * Enable test mode with specific weather condition
   * @param {string} condition - Weather condition
   * @param {number} temperature - Optional temperature override
   */
  setTestWeather(condition, temperature = null) {
    this.testMode = true;
    this.testCondition = condition;
    if (temperature !== null) {
      this.testTemperature = temperature;
    }
    console.log('[WeatherService] Test mode enabled with condition:', condition, 'temperature:', this.testTemperature);
  }

  /**
   * Set complete test weather data
   * @param {object} weatherData - Complete weather data object
   */
  setTestWeatherData(weatherData) {
    this.testMode = true;
    this.testTemperature = weatherData.temperature || 22;
    this.testCondition = weatherData.condition || 'clear';
    this.testHumidity = weatherData.humidity || 50;
    this.testWindSpeed = weatherData.windSpeed || 10;
    console.log('[WeatherService] Test mode enabled with full weather data:', {
      temperature: this.testTemperature,
      condition: this.testCondition,
      humidity: this.testHumidity,
      windSpeed: this.testWindSpeed
    });
  }

  /**
   * Disable test mode
   */
  disableTestMode() {
    this.testMode = false;
    this.testCondition = null;
    this.testTemperature = 25;
    this.testHumidity = 50;
    this.testWindSpeed = 10;
    console.log('[WeatherService] Test mode disabled');
  }
}

export default new WeatherService();