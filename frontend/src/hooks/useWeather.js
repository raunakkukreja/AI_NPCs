// frontend/src/hooks/useWeather.js
import { useState, useEffect } from 'react';
import { 
  getCurrentLocation, 
  getCurrentWeather, 
  getBackgroundSaturation, 
  getWarmColorFilter, 
  getHueRotation 
} from '../services/weatherService';

export const useWeather = () => {
  const [weatherData, setWeatherData] = useState({
    temperature: 20, // Default neutral temperature
    condition: 'Unknown',
    conditions: { isRainy: false, isCloudy: false, isSnowy: false, isSunny: true },
    rainIntensity: 0,
    cloudIntensity: 0,
    loading: true,
    error: null
  });
  
  const [backgroundSaturation, setBackgroundSaturation] = useState(1);
  const [warmColorFilter, setWarmColorFilter] = useState(0);
  const [hueRotation, setHueRotation] = useState(0);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setWeatherData(prev => ({ ...prev, loading: true, error: null }));
        
        // Get user location
        const location = await getCurrentLocation();
        
        // Get weather data
        const weather = await getCurrentWeather(location.latitude, location.longitude);
        
        // Calculate all weather-based visual effects
        const saturation = getBackgroundSaturation(weather.temperature);
        const warmFilter = getWarmColorFilter(weather.temperature);
        const hueRot = getHueRotation(weather.temperature);
        
        setWeatherData({
          temperature: weather.temperature,
          condition: weather.condition,
          conditions: weather.conditions || { isRainy: false, isCloudy: false, isSnowy: false, isSunny: true },
          rainIntensity: weather.rainIntensity || 0,
          cloudIntensity: weather.cloudIntensity || 0,
          loading: false,
          error: null
        });
        
        setBackgroundSaturation(saturation);
        setWarmColorFilter(warmFilter);
        setHueRotation(hueRot);
        
        console.log(`�️ Weather: ${weather.temperature}°C | ${weather.condition} | Rain: ${weather.rainIntensity || 0} | Clouds: ${weather.cloudIntensity || 0} | Hue: ${hueRot.toFixed(1)}°`);
        
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        setWeatherData({
          temperature: 20,
          condition: 'Unknown',
          conditions: { isRainy: false, isCloudy: false, isSnowy: false, isSunny: true },
          rainIntensity: 0,
          cloudIntensity: 0,
          loading: false,
          error: error.message
        });
        setBackgroundSaturation(1); // Default saturation
        setWarmColorFilter(0); // Default warm filter
        setHueRotation(0); // Default hue rotation
      }
    };

    fetchWeatherData();
  }, []);

  return {
    weatherData,
    backgroundSaturation,
    warmColorFilter,
    hueRotation
  };
};