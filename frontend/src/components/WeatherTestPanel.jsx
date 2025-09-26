// frontend/src/components/WeatherTestPanel.jsx
import React, { useState, useEffect } from 'react';

const WeatherTestPanel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTemp, setCurrentTemp] = useState(null);
  const [testMode, setTestMode] = useState(false);

  // Toggle panel visibility with Ctrl+W
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  const testTemperatures = [
    { temp: -5, label: 'Very Cold (-5°C)' },
    { temp: 10, label: 'Cold (10°C)' },
    { temp: 18, label: 'Cool (18°C)' },
    { temp: 25, label: 'Warm (25°C)' },
    { temp: 30, label: 'Hot (30°C)' },
    { temp: 38, label: 'Very Hot (38°C)' },
  ];

  const testWeatherConditions = [
    { condition: 'clear', temp: 25, label: 'Clear Sky', color: '#87CEEB' },
    { condition: 'cloudy', temp: 22, label: 'Cloudy', color: '#B0C4DE' },
    { condition: 'overcast', temp: 18, label: 'Overcast', color: '#778899' },
    { condition: 'rain', temp: 15, label: 'Rainy', color: '#4682B4' },
    { condition: 'storm', temp: 20, label: 'Stormy', color: '#483D8B' },
    { condition: 'snow', temp: -2, label: 'Snowy', color: '#F0F8FF' },
    { condition: 'fog', temp: 12, label: 'Foggy', color: '#DCDCDC' },
  ];

  const applyTestTemperature = (temp) => {
    if (window.setTestTemperature) {
      window.setTestTemperature(temp);
      setCurrentTemp(temp);
      setTestMode(true);
    }
  };

  const applyTestWeather = (condition, temp) => {
    if (window.setTestWeather) {
      window.setTestWeather(condition, temp);
      setCurrentTemp(temp);
      setTestMode(true);
    }
  };

  const restoreRealWeather = () => {
    if (window.disableWeatherTest) {
      window.disableWeatherTest();
      setTestMode(false);
      setCurrentTemp(null);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="weather-test-panel visible">
      <div>
        <strong>Weather Test Panel</strong>
        <div style={{ fontSize: '10px', color: '#aaa' }}>Press Ctrl+W to toggle</div>
      </div>
      
      {testMode && (
        <div style={{ color: '#ffeb3b', marginTop: '5px' }}>
          Test Mode: {currentTemp}°C
        </div>
      )}

      <div className="weather-test-controls">
        <div style={{ marginBottom: '8px', fontSize: '11px', color: '#ccc' }}>
          <strong>Temperature Tests:</strong>
        </div>
        {testTemperatures.map(({ temp, label }) => (
          <button
            key={temp}
            onClick={() => applyTestTemperature(temp)}
            style={{
              backgroundColor: currentTemp === temp ? '#007acc' : '#333',
              fontSize: '9px',
              marginBottom: '2px'
            }}
          >
            {label}
          </button>
        ))}
        
        <div style={{ marginTop: '8px', marginBottom: '5px', fontSize: '11px', color: '#ccc' }}>
          <strong>Weather Conditions:</strong>
        </div>
        {testWeatherConditions.map(({ condition, temp, label, color }) => (
          <button
            key={condition}
            onClick={() => applyTestWeather(condition, temp)}
            style={{
              backgroundColor: color,
              color: condition === 'snow' || condition === 'fog' ? '#333' : '#fff',
              fontSize: '9px',
              marginBottom: '2px',
              border: 'none'
            }}
          >
            {label} ({temp}°C)
          </button>
        ))}
        
        <button
          onClick={restoreRealWeather}
          style={{
            backgroundColor: !testMode ? '#4caf50' : '#666',
            marginTop: '8px'
          }}
        >
          Real Weather
        </button>
      </div>

      <div style={{ fontSize: '9px', color: '#aaa', marginTop: '8px' }}>
        <strong>Console commands:</strong><br/>
        setTestTemperature(25)<br/>
        setTestWeather('rain', 15)<br/>
        setTestWeatherData({`{temperature: 30, condition: 'storm'}`})<br/>
        disableWeatherTest()
      </div>
    </div>
  );
};

export default WeatherTestPanel;