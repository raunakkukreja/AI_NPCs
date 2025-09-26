// frontend/src/components/WeatherDemo.jsx
import React, { useState } from 'react';
import WeatherService from '../services/WeatherService';

const WeatherDemo = () => {
  const [currentTemp, setCurrentTemp] = useState(22);
  const [effects, setEffects] = useState(WeatherService.getWeatherEffects(22));

  const updateTemperature = (temp) => {
    setCurrentTemp(temp);
    const newEffects = WeatherService.getWeatherEffects(temp);
    setEffects(newEffects);
  };

  const demoTemperatures = [
    { temp: -5, label: 'Arctic (-5°C)', color: '#4682B4' },
    { temp: 5, label: 'Very Cold (5°C)', color: '#6495ED' },
    { temp: 15, label: 'Cool (15°C)', color: '#87CEEB' },
    { temp: 22, label: 'Moderate (22°C)', color: '#98FB98' },
    { temp: 25, label: 'Warm (25°C)', color: '#FFE4B5' },
    { temp: 30, label: 'Hot (30°C)', color: '#FFD700' },
    { temp: 38, label: 'Scorching (38°C)', color: '#FF8C00' },
  ];

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f0f0f0', 
      borderRadius: '10px',
      margin: '20px',
      maxWidth: '600px'
    }}>
      <h3>Weather Effects Demo</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Current Temperature: {currentTemp}°C</strong>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Effect: {effects.description}
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px',
        marginBottom: '20px'
      }}>
        {demoTemperatures.map(({ temp, label, color }) => (
          <button
            key={temp}
            onClick={() => updateTemperature(temp)}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '5px',
              backgroundColor: currentTemp === temp ? color : '#ddd',
              color: currentTemp === temp ? 'white' : 'black',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Demo area that shows the visual effects */}
      <div 
        style={{
          width: '100%',
          height: '200px',
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cg fill-opacity=\'0.1\'%3E%3Cpolygon fill=\'%23000\' points=\'50 0 60 40 100 50 60 60 50 100 40 60 0 50 40 40\'/%3E%3C/g%3E%3C/svg%3E") #4a90e2',
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          filter: effects.filter,
          transition: 'filter 1s ease-in-out'
        }}
      >
        {/* Color overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: effects.overlay,
          pointerEvents: 'none',
          transition: 'background-color 1s ease-in-out'
        }} />
        
        {/* Demo content */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'white',
          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Weather Effect Preview
          <br />
          <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
            {effects.description} weather
          </span>
        </div>
      </div>

      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#666',
        background: '#fff',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <strong>Applied Effects:</strong><br />
        Filter: <code>{effects.filter}</code><br />
        Overlay: <code>{effects.overlay}</code><br />
        Intensity: {(effects.intensity * 100).toFixed(0)}%
      </div>
    </div>
  );
};

export default WeatherDemo;