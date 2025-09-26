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

  const applyTestTemperature = (temp) => {
    if (window.setTestTemperature) {
      window.setTestTemperature(temp);
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
        {testTemperatures.map(({ temp, label }) => (
          <button
            key={temp}
            onClick={() => applyTestTemperature(temp)}
            style={{
              backgroundColor: currentTemp === temp ? '#007acc' : '#333'
            }}
          >
            {label}
          </button>
        ))}
        
        <button
          onClick={restoreRealWeather}
          style={{
            backgroundColor: !testMode ? '#4caf50' : '#666',
            marginTop: '5px'
          }}
        >
          Real Weather
        </button>
      </div>

      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '8px' }}>
        Console commands:<br/>
        setTestTemperature(25)<br/>
        disableWeatherTest()
      </div>
    </div>
  );
};

export default WeatherTestPanel;