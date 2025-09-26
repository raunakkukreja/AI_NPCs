// frontend/src/components/WeatherOverlay.jsx
import React, { useEffect, useState } from 'react';
import WeatherService from '../services/WeatherService';

const WeatherOverlay = ({ children }) => {
  const [weatherEffects, setWeatherEffects] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeatherEffects = async () => {
      try {
        const temperature = await WeatherService.getCurrentTemperature();
        const effects = WeatherService.getWeatherEffects(temperature);
        setWeatherEffects(effects);
        console.log('[WeatherOverlay] Applied effects for', effects.description, 'weather');
      } catch (error) {
        console.error('[WeatherOverlay] Error fetching weather effects:', error);
        // Apply default neutral effects
        setWeatherEffects(WeatherService.getWeatherEffects(22));
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
      const effects = WeatherService.getWeatherEffects(temp);
      setWeatherEffects(effects);
      console.log(`Temperature set to ${temp}°C (${effects.description})`);
    };

    window.disableWeatherTest = () => {
      WeatherService.disableTestMode();
      // Refresh with real weather
      WeatherService.getCurrentTemperature().then(temp => {
        const effects = WeatherService.getWeatherEffects(temp);
        setWeatherEffects(effects);
        console.log(`Real weather restored: ${temp}°C (${effects.description})`);
      });
    };

    return () => {
      delete window.setTestTemperature;
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
      <div style={contentStyle} className="weather-content">
        {children}
      </div>
    </div>
  );
};

export default WeatherOverlay;