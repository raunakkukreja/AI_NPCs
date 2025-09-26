// frontend/src/components/WeatherOverlay.jsx
import React, { useEffect, useState } from 'react';
import WeatherService from '../services/WeatherService';
import WeatherAnimations from './WeatherAnimations';

const WeatherOverlay = ({ children }) => {
  const [weatherEffects, setWeatherEffects] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeatherEffects = async () => {
      try {
        const weatherData = await WeatherService.getCurrentWeatherData();
        const effects = WeatherService.getWeatherEffects(weatherData);
        setWeatherEffects(effects);
        console.log('[WeatherOverlay] Applied effects for', effects.description);
      } catch (error) {
        console.error('[WeatherOverlay] Error fetching weather effects:', error);
        // Apply default neutral effects
        setWeatherEffects(WeatherService.getWeatherEffects({ temperature: 22, condition: 'clear' }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherEffects();

    // Update weather every 30 minutes
    const interval = setInterval(fetchWeatherEffects, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Expose weather control methods to window for testing
  useEffect(() => {
    window.setTestTemperature = (temp) => {
      WeatherService.setTestTemperature(temp);
      const effects = WeatherService.getWeatherEffects({ temperature: temp, condition: 'clear' });
      setWeatherEffects(effects);
      console.log(`Temperature set to ${temp}°C (${effects.description})`);
    };

    window.setTestWeather = (condition, temp = 22) => {
      WeatherService.setTestWeather(condition, temp);
      const effects = WeatherService.getWeatherEffects({ temperature: temp, condition });
      setWeatherEffects(effects);
      console.log(`Weather set to ${condition} at ${temp}°C (${effects.description})`);
    };

    window.setTestWeatherData = (weatherData) => {
      WeatherService.setTestWeatherData(weatherData);
      const effects = WeatherService.getWeatherEffects(weatherData);
      setWeatherEffects(effects);
      console.log(`Weather data set:`, weatherData, `(${effects.description})`);
    };

    window.disableWeatherTest = () => {
      WeatherService.disableTestMode();
      // Refresh with real weather
      WeatherService.getCurrentWeatherData().then(weatherData => {
        const effects = WeatherService.getWeatherEffects(weatherData);
        setWeatherEffects(effects);
        console.log(`Real weather restored:`, weatherData, `(${effects.description})`);
      });
    };

    return () => {
      delete window.setTestTemperature;
      delete window.setTestWeather;
      delete window.setTestWeatherData;
      delete window.disableWeatherTest;
    };
  }, []);

  if (isLoading) {
    return <div className="weather-loading">{children}</div>;
  }

  if (!weatherEffects) {
    return <div>{children}</div>;
  }

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    filter: weatherEffects.filter,
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: weatherEffects.overlay,
    pointerEvents: 'none',
    zIndex: 1,
    transition: 'all 1s ease-in-out',
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    height: '100%',
  };

  return (
    <div style={containerStyle} className="weather-container">
      <div style={overlayStyle} className="weather-overlay" />
      <WeatherAnimations 
        animations={weatherEffects.animations || []} 
        intensity={weatherEffects.intensity || 0.5} 
      />
      <div style={contentStyle} className="weather-content">
        {children}
      </div>
    </div>
  );
};

export default WeatherOverlay;