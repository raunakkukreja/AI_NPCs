# AI_NPCs

An interactive game featuring AI-powered NPCs with dynamic weather effects.

## New Feature: Dynamic Weather System

The game now includes a comprehensive real-time weather system with visual effects and animations based on current weather conditions from WeatherAPI.com.

### Weather Conditions & Effects

**🌞 Clear Weather:** Temperature-based lighting (warm yellow to cool blue tints)

**☁️ Cloudy Weather:** Gentle cloud animations, reduced brightness  

**🌫️ Overcast Weather:** Dark gray overlay, gloomy atmosphere

**🌧️ Rainy Weather:** Animated raindrops, blue tint, moody lighting

**⛈️ Stormy Weather:** Heavy rain + lightning flashes, dramatic effects

**❄️ Snowy Weather:** Floating snowflakes, bright desaturated visuals

**🌫️ Foggy Weather:** Drifting fog particles, reduced visibility

### Temperature Effects

**Hot Weather (≥25°C):** Yellow/orange tints, bright sunny atmosphere
**Cold Weather (<25°C):** Blue tints, dull cold atmosphere

### Setup

1. Add your WeatherAPI key to `/frontend/.env`:
   ```
   VITE_WEATHER_API_KEY=your_api_key_here
   ```
   Get a free API key from [WeatherAPI.com](https://www.weatherapi.com/)

2. Optional test mode configuration:
   ```
   VITE_WEATHER_TEST_MODE=true
   VITE_TEST_TEMPERATURE=30
   VITE_TEST_CONDITION=rain
   ```

### Testing Weather Effects

- **Test Panel**: Press `Ctrl+W` in-game to open the comprehensive weather test panel
- **Console Commands**: 
  - `setTestTemperature(35)` - Test temperature effects
  - `setTestWeather('storm', 20)` - Test weather conditions
  - `setTestWeatherData({temperature: 30, condition: 'snow'})` - Test complete weather data
  - `disableWeatherTest()` - Return to real weather

