// frontend/src/components/WeatherDebug.jsx
import React from 'react';
import { useWeather } from '../hooks/useWeather';

const WeatherDebug = () => {
  const { weatherData, backgroundSaturation } = useWeather();

  if (!weatherData || weatherData.loading) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        🌤️ Loading weather...
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div>🌡️ {weatherData.temperature}°C</div>
      <div>🎨 Saturation: {backgroundSaturation.toFixed(2)}x</div>
      <div>{weatherData.condition}</div>
      {weatherData.error && <div style={{color: 'red'}}>Error: {weatherData.error}</div>}
    </div>
  );
};

export default WeatherDebug;