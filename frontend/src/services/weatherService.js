// frontend/src/services/weatherService.js

const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';

// 🧪 WEATHER TESTING CONFIGURATION
const WEATHER_TEST_CONFIG = {
  enabled: true,  // Set to false to use real weather
  temperature: 15,  // Change this value to test different temperatures
  condition: 'Snow' // 👈 CHANGE THIS FOR DIFFERENT EFFECTS
};

// 🌡️ TEMPERATURE TEST VALUES:
// 10°C = Very Cold (Blue)
// 15°C = Cold (Light Blue) 
// 20°C = Cool (Slight Blue)
// 25°C = Neutral (No Effect)
// 30°C = Warm (Yellow)
// 35°C = Hot (Very Yellow)
// 40°C = Very Hot (Extreme Yellow)

// 🌧️ WEATHER CONDITION TEST VALUES:
// 'Heavy rain' = Strong rain effect
// 'Light rain' = Light rain effect  
// 'Overcast' = Strong cloudy effect
// 'Partly cloudy' = Light cloudy effect
// 'Sunny' = Clear/bright effect
// 'Thunderstorm' = Heavy rain + dark effect
// 'Drizzle' = Very light rain
// 'Snow' = Snow effect
// 'Clear' = No effects

// 🌡️ TEMPERATURE TEST VALUES:
// 10°C = Very Cold (Blue)
// 15°C = Cold (Light Blue) 
// 20°C = Cool (Slight Blue)
// 25°C = Neutral (No Effect)
// 30°C = Warm (Yellow)
// 35°C = Hot (Very Yellow)
// 40°C = Very Hot (Extreme Yellow)

/**
 * Get current weather for a location
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<{temperature: number, condition: string}>}
 */
export const getCurrentWeather = async (latitude, longitude) => {
  // 🧪 TESTING MODE - Check if test mode is enabled
  if (WEATHER_TEST_CONFIG.enabled) {
    console.log(`🧪 WEATHER TEST MODE: ${WEATHER_TEST_CONFIG.temperature}°C - ${WEATHER_TEST_CONFIG.condition}`);
    
    const conditions = getWeatherConditions(WEATHER_TEST_CONFIG.condition);
    const rainIntensity = getRainIntensity(WEATHER_TEST_CONFIG.condition);
    const cloudIntensity = getCloudIntensity(WEATHER_TEST_CONFIG.condition);
    
    return {
      temperature: WEATHER_TEST_CONFIG.temperature,
      condition: WEATHER_TEST_CONFIG.condition,
      conditions,
      rainIntensity,
      cloudIntensity
    };
  }

  // Real weather API call
  try {
    const response = await fetch(
      `${WEATHER_API_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}&aqi=no`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    const conditionText = data.current.condition.text;
    const conditions = getWeatherConditions(conditionText);
    const rainIntensity = getRainIntensity(conditionText);
    const cloudIntensity = getCloudIntensity(conditionText);
    
    return {
      temperature: data.current.temp_c,
      condition: conditionText,
      conditions,
      rainIntensity,
      cloudIntensity
    };
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    // Return default weather if API fails
    return {
      temperature: 20,
      condition: 'Unknown',
      conditions: { isRainy: false, isCloudy: false, isSnowy: false, isSunny: true },
      rainIntensity: 0,
      cloudIntensity: 0
    };
  }
};

/**
 * Get user's current location
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Fallback to a default location (e.g., Athens, Greece since the game is set there)
        resolve({
          latitude: 37.9838,
          longitude: 23.7275
        });
      },
      {
        timeout: 10000,
        enableHighAccuracy: false
      }
    );
  });
};

/**
 * Get weather-based background saturation
 * @param {number} temperature 
 * @returns {number} Saturation multiplier - boost for extreme weather
 */
export const getBackgroundSaturation = (temperature) => {
  const baseTemperature = 25;
  
  if (temperature < 15 || temperature > 30) {
    // Extreme weather: boost saturation even more for visibility
    return 2.0;
  } else {
    // Normal weather: high saturation
    return 1.5;
  }
};

/**
 * Get weather-based color temperature - REMOVED sepia (was causing black/white effect)
 * @param {number} temperature 
 * @returns {number} Not used anymore - replaced with hue rotation only
 */
export const getWarmColorFilter = (temperature) => {
  // Remove sepia filter completely - it was causing desaturation
  return 0;
};

/**
 * Get weather-based hue rotation for color temperature
 * @param {number} temperature 
 * @returns {number} Hue rotation in degrees
 */
export const getHueRotation = (temperature) => {
  const baseTemperature = 25;
  
  if (temperature > baseTemperature) {
    // HOT weather: shift towards VERY YELLOW (-120 degrees max for extreme heat)
    const warmthFactor = Math.min((temperature - baseTemperature) / 2, 120);
    const hue = -warmthFactor; // Negative = towards yellow/orange
    console.log(`🔥 HOT: ${temperature}°C -> Hue: ${hue}°`);
    return hue;
  } else if (temperature < baseTemperature) {
    // COLD weather: shift towards VERY BLUE (+180 degrees max for extreme cold)
    const coolFactor = Math.min((baseTemperature - temperature) / 1.5, 180);
    const hue = coolFactor; // Positive = towards blue/cyan
    console.log(`❄️ COLD: ${temperature}°C -> Hue: +${hue}°`);
    return hue;
  } else {
    // Exactly 25°C: neutral (no hue shift)
    console.log(`🌡️ NEUTRAL: ${temperature}°C -> Hue: 0°`);
    return 0;
  }
};

/**
 * Detect weather conditions from API response
 * @param {string} conditionText - Weather condition from API
 * @returns {object} Weather condition flags
 */
export const getWeatherConditions = (conditionText) => {
  const condition = conditionText.toLowerCase();
  
  return {
    isRainy: condition.includes('rain') || 
             condition.includes('drizzle') || 
             condition.includes('shower') ||
             condition.includes('storm') ||
             condition.includes('thunderstorm'),
    
    isCloudy: condition.includes('cloud') || 
              condition.includes('overcast') || 
              condition.includes('fog') ||
              condition.includes('mist'),
    
    isSnowy: condition.includes('snow') || 
             condition.includes('blizzard') ||
             condition.includes('sleet'),
    
    isSunny: condition.includes('sunny') || 
             condition.includes('clear') ||
             condition.includes('fair')
  };
};

/**
 * Get rain effect intensity
 * @param {string} conditionText 
 * @returns {number} Rain intensity (0-1)
 */
export const getRainIntensity = (conditionText) => {
  const condition = conditionText.toLowerCase();
  
  if (condition.includes('heavy rain') || condition.includes('storm') || condition.includes('thunderstorm')) {
    return 1.0; // Heavy rain
  } else if (condition.includes('moderate rain') || condition.includes('rain')) {
    return 0.6; // Moderate rain
  } else if (condition.includes('light rain') || condition.includes('drizzle') || condition.includes('shower')) {
    return 0.3; // Light rain
  }
  
  return 0; // No rain
};

/**
 * Get cloud effect intensity
 * @param {string} conditionText 
 * @returns {number} Cloud intensity (0-1)
 */
export const getCloudIntensity = (conditionText) => {
  const condition = conditionText.toLowerCase();
  
  if (condition.includes('overcast') || condition.includes('heavy cloud')) {
    return 0.8; // Very cloudy
  } else if (condition.includes('mostly cloudy') || condition.includes('cloudy')) {
    return 0.6; // Cloudy
  } else if (condition.includes('partly cloudy') || condition.includes('few clouds')) {
    return 0.3; // Partly cloudy
  }
  
  return 0; // Clear
};