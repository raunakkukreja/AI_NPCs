# AI NPCs - Interactive Game with Dynamic Weather & Smart Lighting

An immersive interactive game featuring AI-powered NPCs with dynamic weather effects, real-time conversations, and smart bulb integration for enhanced gameplay experience.

##  Features

###  AI-Powered NPCs
- **Dynamic Conversations**: NPCs powered by local LLaMA 3 8B model with persistent memory
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

### AI Model Server
- **Python 3.8+** with FastAPI
- **LLaMA-cpp-python** for local AI inference
- **Meta-Llama-3-8B-Instruct** (Q4_K_M quantized)

### Smart Home Integration
- **pywizlight** for Philips Wiz bulb control
- **asyncio** for non-blocking bulb operations

##  Prerequisites

### System Requirements
- **Python**: 3.8 or higher
- **Node.js**: 16.0 or higher
- **npm**: 8.0 or higher
- **RAM**: 8GB minimum (16GB recommended for AI model)
- **Storage**: 5GB free space for AI model

### API Keys & Hardware
- **WeatherAPI.com** account (free tier available)
- **Philips Wiz Smart Bulb** (optional, for lighting effects)
- **Hugging Face** account (for model download)

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

Create `.env` file in `backend/` directory:
```env
LOCAL_LLM_URL=http://127.0.0.1:8000
LOCAL_LLM_API_KEY=RVVL
PORT=3000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file in `frontend/` directory:
```env
VITE_BACKEND_URL=http://localhost:3000

# WeatherAPI.com API key (get from https://www.weatherapi.com/)
VITE_WEATHER_API_KEY=your_api_key_here

# Optional: Weather test mode
VITE_WEATHER_TEST_MODE=false
VITE_TEST_TEMPERATURE=25
VITE_TEST_CONDITION=clear
```

### 4. AI Model Server Setup

#### Install Python Dependencies
```bash
cd model_server
pip install fastapi uvicorn llama-cpp-python huggingface-hub pywizlight
```

#### Download AI Model
The model will be automatically downloaded on first run, or manually download:
```bash
python model.py
```

#### Configure Model Server
Set environment variables or update `model_server.py`:
```bash
# Windows
set MODEL_PATH=C:\Users\%USERNAME%\.cache\huggingface\hub\models--QuantFactory--Meta-Llama-3-8B-Instruct-GGUF\snapshots\<hash>\Meta-Llama-3-8B-Instruct.Q4_K_M.gguf
set RVVL=your_api_key
set MODEL_PORT=8000

# Linux/Mac
export MODEL_PATH=/path/to/model.gguf
export RVVL=your_api_key
export MODEL_PORT=8000
```

### 5. Smart Bulb Setup (Optional)
If you have a Philips Wiz bulb:
1. Connect bulb to your WiFi network
2. Find the bulb's IP address
3. Update IP in `model_server/game_bulb_controller.py`:
```python
def __init__(self, bulb_ip="192.168.1.XXX"):  # Your bulb's IP
```

##  Running the Application

### Start All Services

#### 1. Start AI Model Server
```bash
cd model_server
python model_server.py
```
Server runs on `http://localhost:8000`

#### 2. Start Backend
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:3000`

#### 3. Start Frontend
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
Adjust model parameters in `model_server/model_server.py`:
```python
llm = Llama(
    model_path=MODEL_PATH,
    n_ctx=4096,          # Context window size
    n_gpu_layers=1,      # GPU layers (0 for CPU only)
    verbose=False
)
```

### NPC Customization
Edit NPC personalities in `backend/data/npcs/` directory. Each NPC has:
- **Personality traits**
- **Background story**
- **Relationship preferences**
- **Location associations**

##  Troubleshooting

### Common Issues

#### Model Server Won't Start
- Ensure Python 3.8+ is installed
- Check if model file exists and path is correct
- Verify sufficient RAM (8GB minimum)

#### Weather Effects Not Working
- Verify WeatherAPI key is valid
- Check internet connection
- Enable test mode to verify effects work

#### Smart Bulb Not Responding
- Confirm bulb IP address is correct
- Ensure bulb is on same network
- Check if `pywizlight` is installed

#### NPCs Not Responding
- Verify model server is running on port 8000
- Check backend logs for API connection errors
- Ensure API key matches between backend and model server

### Performance Optimization
- **Reduce model context**: Lower `n_ctx` in model configuration
- **CPU-only mode**: Set `n_gpu_layers=0` if GPU causes issues
- **Weather update frequency**: Adjust `updateInterval` in WeatherService

##  Project Structure

```
AI_NPCs/
├── backend/                 # Node.js Express server
│   ├── controllers/         # API route handlers
│   ├── data/               # Game data (NPCs, areas, relationships)
│   ├── services/           # Core game services
│   └── server.js           # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   └── services/       # Frontend services
│   └── public/assets/      # Game assets (images, sounds)
├── model_server/           # Python AI model server
│   ├── model_server.py     # FastAPI server
│   ├── model.py           # Model download script
│   └── game_bulb_controller.py  # Smart bulb integration
└── README.md              # This file
```


##  License

This project is licensed under the MIT License - see the LICENSE file for details.
