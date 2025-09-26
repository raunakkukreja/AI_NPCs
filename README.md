# AI_NPCs

An interactive game featuring AI-powered NPCs with dynamic weather effects.

## New Feature: Weather-Based Visual Effects

The game now includes real-time weather effects that change the visual appearance of the map based on current temperature data from WeatherAPI.com.

### Weather Effects

**Hot Weather (≥25°C):**
- 25-29°C: Subtle yellow tint, slightly brighter
- 30-34°C: More pronounced yellow, increased brightness  
- 35°C+: Intense yellow-orange, very bright and saturated

**Cold Weather (<25°C):**
- 15-24°C: Neutral with very slight blue tint
- 5-14°C: Blue tint, reduced saturation and brightness
- <5°C: Strong blue tint, very dull and desaturated

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
   ```

### Testing Weather Effects

- **Test Panel**: Press `Ctrl+W` in-game to open the weather test panel
- **Console Commands**: 
  - `setTestTemperature(35)` - Test hot weather
  - `setTestTemperature(-5)` - Test cold weather  
  - `disableWeatherTest()` - Return to real weather

