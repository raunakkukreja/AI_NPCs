// frontend/src/services/WeatherService.js

class WeatherService {
  constructor() {
    this.apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    this.testMode = import.meta.env.VITE_WEATHER_TEST_MODE === 'true';
    this.testTemperature = parseFloat(import.meta.env.VITE_TEST_TEMPERATURE) || 25;
    this.testCondition = import.meta.env.VITE_TEST_CONDITION || 'clear';
    this.testConditionText = import.meta.env.VITE_TEST_CONDITION_TEXT || 'Clear';
    this.cachedWeather = null;
    this.lastFetchTime = 0;
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
  }

  async getCurrentWeather(location = 'Athens,Greece') {
    // If in test mode, return test weather
    if (this.testMode) {
      const rawCondition = this.testCondition || 'clear';
      const testWeather = {
        temperature: this.testTemperature,
        condition: this.normalizeCondition(rawCondition),
        conditionText: this.testConditionText || rawCondition
      };
      console.log('[WeatherService] Test mode enabled, returning test weather:', testWeather);
      return testWeather;
    }

    // Check cache first
    const now = Date.now();
    if (this.cachedWeather && (now - this.lastFetchTime) < this.cacheExpiry) {
      console.log('[WeatherService] Returning cached weather:', this.cachedWeather);
      return this.cachedWeather;
    }

    try {
      if (!this.apiKey || this.apiKey === 'your_weatherapi_key_here') {
        console.warn('[WeatherService] No valid API key found, using default weather');
        return { temperature: 22, condition: 'clear', conditionText: 'Clear' };
      }

      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${location}`
      );

      if (!response.ok) {
        throw new Error(`Weather API request failed: ${response.status}`);
      }

      const data = await response.json();
      const weather = {
        temperature: data.current.temp_c,
        condition: this.normalizeCondition(data.current.condition.text),
        conditionText: data.current.condition.text,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        visibility: data.current.vis_km
      };
      
      // Cache the result
      this.cachedWeather = weather;
      this.lastFetchTime = now;
      
      console.log('[WeatherService] Fetched weather:', weather);
      return weather;
    } catch (error) {
      console.error('[WeatherService] Error fetching weather:', error);
      // Return default weather on error
      return { temperature: 22, condition: 'clear', conditionText: 'Clear' };
    }
  }

  async getCurrentTemperature(location = 'Athens,Greece') {
    const weather = await this.getCurrentWeather(location);
    return weather.temperature;
  }

  /**
   * Normalize weather condition text to standard categories
   * @param {string} conditionText - Raw condition text from API
   * @returns {string} Normalized condition
   */
  normalizeCondition(conditionText) {
    const condition = conditionText.toLowerCase();
    console.log('[WeatherService] Normalizing condition:', conditionText, '->', condition);
    
    if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('shower')) {
      console.log('[WeatherService] Detected rain condition');
      return 'rain';
    }
    if (condition.includes('snow') || condition.includes('blizzard') || condition.includes('sleet')) {
      console.log('[WeatherService] Detected snow condition');
      return 'snow';
    }
    if (condition.includes('fog') || condition.includes('mist')) {
      console.log('[WeatherService] Detected fog condition');
      return 'fog';
    }
    if (condition.includes('cloud') || condition.includes('overcast')) {
      console.log('[WeatherService] Detected cloudy condition');
      return 'cloudy';
    }
    if (condition.includes('thunder') || condition.includes('storm')) {
      console.log('[WeatherService] Detected storm condition');
      return 'storm';
    }
    if (condition.includes('clear') || condition.includes('sunny')) {
      console.log('[WeatherService] Detected clear condition');
      return 'clear';
    }
    if (condition.includes('partly')) {
      console.log('[WeatherService] Detected partly cloudy condition');
      return 'partly_cloudy';
    }
    
    console.log('[WeatherService] Using default clear condition for:', conditionText);
    return 'clear'; // Default fallback
  }

  /**
   * Calculate weather visual effects based on temperature and condition
   * @param {number} temperature - Temperature in Celsius
   * @param {string} condition - Weather condition
   * @returns {object} Visual effect properties
   */
  getWeatherEffects(temperature, condition = 'clear') {
    const effects = {
      temperature,
      condition,
      isCold: temperature < 25,
      isHot: temperature >= 25,
      intensity: 0.5, // Base intensity
      animations: [], // CSS animations to apply
      particles: null // Particle effects
    };

    // First apply temperature-based effects
    this.applyTemperatureEffects(effects, temperature);
    
    // Then apply condition-based effects
    this.applyConditionEffects(effects, condition);

    return effects;
  }

  applyTemperatureEffects(effects, temperature) {
    if (temperature >= 35) {
      effects.baseFilter = 'brightness(1.4) saturate(1.3) sepia(0.3) hue-rotate(10deg)';
      effects.baseOverlay = 'rgba(255, 215, 0, 0.15)';
      effects.temperatureDescription = 'scorching hot';
    } else if (temperature >= 30) {
      effects.baseFilter = 'brightness(1.3) saturate(1.2) sepia(0.2) hue-rotate(5deg)';
      effects.baseOverlay = 'rgba(255, 235, 59, 0.12)';
      effects.temperatureDescription = 'very hot';
    } else if (temperature >= 25) {
      effects.baseFilter = 'brightness(1.15) saturate(1.1) sepia(0.1)';
      effects.baseOverlay = 'rgba(255, 245, 157, 0.08)';
      effects.temperatureDescription = 'warm';
    } else if (temperature >= 15) {
      effects.baseFilter = 'brightness(0.95) saturate(0.95) hue-rotate(-5deg)';
      effects.baseOverlay = 'rgba(173, 216, 230, 0.05)';
      effects.temperatureDescription = 'cool';
    } else if (temperature >= 5) {
      effects.baseFilter = 'brightness(0.85) saturate(0.8) hue-rotate(-10deg) contrast(0.95)';
      effects.baseOverlay = 'rgba(135, 206, 250, 0.1)';
      effects.temperatureDescription = 'cold';
    } else {
      effects.baseFilter = 'brightness(0.75) saturate(0.6) hue-rotate(-15deg) contrast(0.9)';
      effects.baseOverlay = 'rgba(70, 130, 180, 0.15)';
      effects.temperatureDescription = 'very cold';
    }
  }

  applyConditionEffects(effects, condition) {
    switch (condition) {
      case 'rain':
        effects.filter = `${effects.baseFilter} contrast(0.85) brightness(0.7) saturate(0.9)`;
        effects.overlay = 'rgba(100, 149, 237, 0.25)'; // More visible cornflower blue
        effects.conditionOverlay = 'rgba(0, 0, 0, 0.2)'; // Darker overlay for rain atmosphere
        effects.animations.push('rain-effect');
        effects.particles = 'rain';
        effects.conditionDescription = 'rainy';
        effects.intensity = Math.max(effects.intensity, 0.8);
        break;

      case 'snow':
        effects.filter = `${effects.baseFilter} brightness(1.3) contrast(0.75) saturate(0.4)`;
        effects.overlay = 'rgba(240, 248, 255, 0.3)'; // More visible alice blue
        effects.conditionOverlay = 'rgba(255, 255, 255, 0.15)'; // Light white overlay
        effects.animations.push('snow-effect');
        effects.particles = 'snow';
        effects.conditionDescription = 'snowy';
        effects.intensity = Math.max(effects.intensity, 0.8);
        break;

      case 'fog':
      case 'mist':
        effects.filter = `${effects.baseFilter} blur(0.5px) contrast(0.7) brightness(0.9)`;
        effects.overlay = 'rgba(220, 220, 220, 0.3)'; // Light gray
        effects.conditionOverlay = 'rgba(255, 255, 255, 0.15)'; // Misty white
        effects.animations.push('fog-effect');
        effects.conditionDescription = condition === 'fog' ? 'foggy' : 'misty';
        effects.intensity = Math.max(effects.intensity, 0.6);
        break;

      case 'cloudy':
      case 'overcast':
        effects.filter = `${effects.baseFilter} brightness(0.7) contrast(0.9) saturate(0.8)`;
        effects.overlay = 'rgba(128, 128, 128, 0.2)'; // Gray
        effects.conditionOverlay = 'rgba(0, 0, 0, 0.1)'; // Darker overlay
        effects.conditionDescription = condition === 'cloudy' ? 'cloudy' : 'overcast';
        effects.intensity = Math.max(effects.intensity, 0.5);
        break;

      case 'partly_cloudy':
        effects.filter = `${effects.baseFilter} brightness(0.9) contrast(1.05)`;
        effects.overlay = effects.baseOverlay; // Keep base overlay
        effects.conditionOverlay = 'rgba(128, 128, 128, 0.05)'; // Very light gray
        effects.conditionDescription = 'partly cloudy';
        break;

      case 'storm':
        effects.filter = `${effects.baseFilter} brightness(0.5) contrast(1.3) saturate(0.6)`;
        effects.overlay = 'rgba(75, 0, 130, 0.25)'; // More visible indigo
        effects.conditionOverlay = 'rgba(0, 0, 0, 0.3)'; // Very dark overlay
        effects.animations.push('storm-effect', 'rain-effect');
        effects.particles = 'storm';
        effects.conditionDescription = 'stormy';
        effects.intensity = 0.9;
        break;

      case 'clear':
      default:
        effects.filter = effects.baseFilter;
        effects.overlay = effects.baseOverlay;
        effects.conditionDescription = 'clear';
        break;
    }

    // Combine description
    if (effects.conditionDescription && effects.temperatureDescription) {
      effects.description = `${effects.conditionDescription} and ${effects.temperatureDescription}`;
    } else {
      effects.description = effects.conditionDescription || effects.temperatureDescription || 'pleasant';
    }
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
   * @param {string} conditionText - Human readable condition text
   */
  setTestCondition(condition, conditionText = null) {
    this.testMode = true;
    this.testCondition = condition;
    this.testConditionText = conditionText || condition;
    console.log('[WeatherService] Test mode enabled with condition:', condition);
  }

  /**
   * Enable test mode with both temperature and condition
   * @param {number} temperature - Test temperature in Celsius
   * @param {string} condition - Weather condition
   * @param {string} conditionText - Human readable condition text
   */
  setTestWeather(temperature, condition, conditionText = null) {
    this.testMode = true;
    this.testTemperature = temperature;
    this.testCondition = condition;
    this.testConditionText = conditionText || condition;
    console.log('[WeatherService] Test mode enabled with weather:', { temperature, condition });
  }

  /**
   * Disable test mode
   */
  disableTestMode() {
    this.testMode = false;
    console.log('[WeatherService] Test mode disabled');
  }
}

export default new WeatherService();