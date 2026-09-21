# AI NPCs - Interactive Game with Dynamic Weather & Smart Lighting

An immersive interactive game featuring AI-powered NPCs with dynamic weather effects, real-time conversations, and smart bulb integration for enhanced gameplay experience.

##  Features

###  AI-Powered NPCs
- **Dynamic Conversations**: NPCs powered by the Claude API with persistent memory
- **Personality System**: Each NPC has unique personality traits, relationships, and behavioral patterns
- **Memory & Relationships**: NPCs remember past interactions and maintain relationship matrices
- **Gossip System**: NPCs share information and rumors that spread throughout the game world
- **Contextual Responses**: Location-aware conversations that adapt to the environment

###  Dynamic Weather System
- **Real-time Weather**: Integration with WeatherAPI.com for live weather data
- **Visual Effects**: Animated weather particles (rain, snow, fog) with atmospheric lighting
- **Temperature Effects**: Hot/cold weather influences NPC behavior and visual atmosphere
- **Weather Conditions**: 
  -  Clear: Bright, warm lighting
  -  Cloudy: Gentle cloud animations, reduced brightness
  -  Overcast: Dark gray overlay, gloomy atmosphere
  -  Rain: Animated raindrops with blue tint
  -  Storm: Heavy rain with lightning flashes
  -  Snow: Floating snowflakes with desaturated visuals
  -  Fog: Drifting fog particles with reduced visibility

###  Smart Bulb Integration
- **Philips Wiz Light Integration**: Physical smart bulb responds to game events
- **Dynamic Lighting**: Colors change based on:
  - NPC interactions (each NPC has unique color)
  - Location changes (different areas have themed colors)
  - Game events (gossip sharing, danger, movement)
  - Conversation tone (friendly, hostile, mysterious)

###  Interactive World
- **2D Village Map**: Navigate through different locations (Royal Court, Market, Garden, etc.)
- **Location-based NPCs**: Characters positioned in contextually appropriate areas
- **Interactive Elements**: Click-to-move navigation with sound effects
- **Atmospheric Audio**: Background music and interaction sound effects

##  Tech Stack

### Frontend
- **React 18** with Vite
- **Three.js** for 3D graphics and weather effects
- **CSS3** for animations and styling

### Backend
- **Node.js** with Express
- **CORS** enabled for cross-origin requests
- **Real-time streaming** for AI responses

### AI
- **Claude API** (Anthropic) for NPC dialogue generation

### Smart Home Integration
- **pywizlight** for Philips Wiz bulb control
- **asyncio** for non-blocking bulb operations

##  Prerequisites

### System Requirements
- **Node.js**: 16.0 or higher
- **npm**: 8.0 or higher
- **Python**: 3.8+ (only needed for the optional smart bulb integration)

### API Keys & Hardware
- **Anthropic API key** (for NPC dialogue via the Claude API)
- **WeatherAPI.com** account (free tier available)
- **Philips Wiz Smart Bulb** (optional, for lighting effects)

##  Installation & Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd AI_NPCs
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory (see `backend/.env.example`):
```env
PORT=3000
ANTHROPIC_API_KEY=your-anthropic-api-key
FRONTEND_URL=http://localhost:3001
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file in `frontend/` directory (see `frontend/.env.example`):
```env
VITE_BACKEND_URL=

# WeatherAPI.com API key (get from https://www.weatherapi.com/)
VITE_WEATHER_API_KEY=your_api_key_here

# Optional: Weather test mode
VITE_WEATHER_TEST_MODE=false
VITE_TEST_TEMPERATURE=25
VITE_TEST_CONDITION=clear
```
Leave `VITE_BACKEND_URL` empty for local dev — Vite proxies `/api` requests to
`http://localhost:3000` (see `vite.config.js`). Set it to your deployed
backend's URL only when building for production.

### 4. Smart Bulb Setup (Optional)
Requires Python 3.8+ and `pywizlight` (`pip install pywizlight`). If you have
a Philips Wiz bulb:
1. Connect bulb to your WiFi network
2. Find the bulb's IP address
3. Update IP in `model_server/game_bulb_controller.py`:
```python
def __init__(self, bulb_ip="192.168.1.XXX"):  # Your bulb's IP
```
This feature is optional — the backend runs fine without Python installed;
bulb calls just silently no-op.

##  Running the Application

### Start All Services

#### 1. Start Backend
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3000`

#### 2. Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:3001`

### Access the Game
Open your browser and navigate to `http://localhost:3001`

##  How to Play

### Basic Controls
- **Click to Move**: Click anywhere on the map to move your character
- **Interact with NPCs**: Click on NPCs to start conversations
- **Type Messages**: Use the chat box to communicate with NPCs
- **Navigate Areas**: Move between different locations on the map

### Weather Testing
- **Test Panel**: Press `Ctrl+W` to open the weather test panel
- **Console Commands**:
  ```javascript
  setTestTemperature(35)  // Test temperature effects
  setTestWeather('storm', 20)  // Test weather conditions
  setTestWeatherData({temperature: 30, condition: 'snow'})  // Complete weather data
  disableWeatherTest()  // Return to real weather
  ```

### Advanced Features
- **Gossip System**: Share information between NPCs to see how rumors spread
- **Relationship Building**: Build relationships with NPCs through repeated interactions
- **Location Effects**: Notice how NPCs behave differently in various locations
- **Smart Bulb**: Watch your smart bulb change colors based on game events

##  Configuration

### Weather API Setup
1. Sign up at [WeatherAPI.com](https://www.weatherapi.com/)
2. Get your free API key
3. Add to `frontend/.env`:
```env
VITE_WEATHER_API_KEY=your_actual_api_key_here
```

### AI Model Configuration
The model used for NPC dialogue is set via `ANTHROPIC_MODEL` in `backend/.env`
(defaults to `claude-opus-5`); see `backend/services/LLMGateway.js`.

### NPC Customization
Edit NPC personalities in `backend/data/npcs/` directory. Each NPC has:
- **Personality traits**
- **Background story**
- **Relationship preferences**
- **Location associations**

##  Troubleshooting

### Common Issues

#### NPCs Not Responding / Replying "The NPC falls silent."
- Verify `ANTHROPIC_API_KEY` is set in `backend/.env` (or your host's env vars)
- Check backend logs for `LLMGateway auth error` or other Anthropic API errors

#### Weather Effects Not Working
- Verify WeatherAPI key is valid
- Check internet connection
- Enable test mode to verify effects work

#### Smart Bulb Not Responding
- Confirm bulb IP address is correct
- Ensure bulb is on same network
- Check if `pywizlight` is installed

### Performance Optimization
- **Weather update frequency**: Adjust `updateInterval` in WeatherService

##  Project Structure

```
AI_NPCs/
├── backend/                 # Node.js Express server (calls the Claude API)
│   ├── controllers/         # API route handlers
│   ├── data/               # Game data (NPCs, areas, relationships)
│   ├── services/           # Core game services
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── services/       # Frontend services
│   └── public/assets/      # Game assets (images, sounds)
├── model_server/           # Optional smart-bulb Python scripts only
│   └── game_bulb_controller.py  # Smart bulb integration
└── README.md              # This file
```

##  Deployment

This is a two-part deploy: a static frontend and a long-running backend
process (the backend can't run as a serverless function — it persists game
state, memory and gossip to local JSON files, and needs a single persistent
process for that to work).

### Frontend → Vercel
1. Import the repo into Vercel, set the project root to `frontend/`.
2. Vercel picks up `frontend/vercel.json` (Vite build, SPA rewrites) automatically.
3. Set the environment variable `VITE_BACKEND_URL` to your deployed backend's
   URL (e.g. `https://ai-npcs-backend.onrender.com`), plus your
   `VITE_WEATHER_API_KEY` etc. from `frontend/.env.example`.

### Backend → Render (or any host that runs a persistent Node process)
1. This repo includes a `render.yaml` at the root (Render "Blueprint")
   pointing at `backend/` with `npm install` / `npm start`.
2. Set `ANTHROPIC_API_KEY` (required) and `FRONTEND_URL` (your Vercel URL,
   for CORS) in the service's environment variables.
3. Once deployed, set the frontend's `VITE_BACKEND_URL` to this service's URL
   and redeploy the frontend.

### Notes
- Game state, NPC memory, and gossip persist to local JSON files under
  `backend/data/`. That's fine for a single-instance demo, but state resets
  on every redeploy and won't survive horizontal scaling or multiple
  instances.
- The smart bulb integration (`model_server/game_bulb_controller.py`) is a
  local hardware feature — it silently no-ops on any host without Python or
  the physical bulb, so it's safe to leave as-is when deploying.

##  License

This project is licensed under the MIT License - see the LICENSE file for details.
