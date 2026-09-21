// Test file to verify weather functionality
// Run this in browser console after the app loads

console.log('🌤️ Weather Feature Test Suite');

// Test 1: Verify WeatherService exists
if (window.setTestTemperature && window.disableWeatherTest) {
  console.log(' Weather test functions are available');
} else {
  console.log('Weather test functions are not available');
}

// Test 2: Test different temperature ranges
const testTemperatures = [
  { temp: -10, expected: 'very cold' },
  { temp: 10, expected: 'cold' },
  { temp: 20, expected: 'cool' },
  { temp: 25, expected: 'warm' },
  { temp: 32, expected: 'very hot' },
  { temp: 40, expected: 'scorching hot' }
];

console.log('🧪 Testing temperature effects...');

testTemperatures.forEach(({ temp, expected }, index) => {
  setTimeout(() => {
    if (window.setTestTemperature) {
      window.setTestTemperature(temp);
      console.log(`🌡️ Set temperature to ${temp}°C (${expected})`);
    }
  }, index * 2000); // 2 second intervals
});

// Test 3: Return to real weather after tests
setTimeout(() => {
  if (window.disableWeatherTest) {
    window.disableWeatherTest();
    console.log('🌍 Returned to real weather data');
  }
}, testTemperatures.length * 2000 + 2000);

console.log('⏱️ Tests will run automatically. Watch the visual changes!');
console.log('💡 Press Ctrl+W to open the weather test panel');

// Test 4: Verify visual effects are being applied
setTimeout(() => {
  const weatherContainer = document.querySelector('.weather-container');
  const weatherOverlay = document.querySelector('.weather-overlay');
  
  if (weatherContainer && weatherOverlay) {
    console.log(' Weather DOM elements found');
    console.log(' Current filter:', weatherContainer.style.filter);
    console.log(' Current overlay:', weatherOverlay.style.backgroundColor);
  } else {
    console.log(' Weather DOM elements not found');
  }
}, 1000);