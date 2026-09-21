from pywizlight import wizlight, PilotBuilder
import asyncio
import sys
import json

class GameBulbController:
    def __init__(self, bulb_ip="192.168.29.79"):
        self.bulb = wizlight(bulb_ip)
        self.current_state = None
        
    async def set_color(self, r, g, b, brightness=255):
        try:
            await self.bulb.turn_on(PilotBuilder(rgb=(r, g, b), brightness=brightness))
            self.current_state = (r, g, b, brightness)
        except Exception as e:
            print(f"Bulb error: {e}")
    
    async def handle_interaction(self, npc_id):
        colors = {
            'guard': (0, 0, 255),      # Blue - authority
            'guard2': (0, 0, 255),     # Blue - authority  
            'thief': (255, 0, 0),      # Red - danger
            'merchant': (255, 255, 0), # Yellow - commerce
            'bartender': (255, 165, 0), # Orange - tavern
            'old_man': (128, 128, 128), # Gray - wisdom
            'woman_1': (255, 192, 203), # Pink - gentle
            'woman_2': (255, 192, 203), # Pink - gentle
            'boy': (0, 255, 0)         # Green - youth
        }
        r, g, b = colors.get(npc_id, (255, 255, 255))
        print(f"[BULB] Interaction with {npc_id} -> RGB({r}, {g}, {b})")
        await self.set_color(r, g, b, 200)
    
    async def handle_location(self, location_id):
        colors = {
            'royal_court': (0, 0, 255),    # Blue - authority
            'desmos_inn': (255, 165, 0),   # Orange - warmth
            'moachivitis_market': (255, 255, 0), # Yellow - commerce
            'garden': (0, 255, 0),         # Green - nature
            'fountain': (0, 255, 255),     # Cyan - water
            'old_ruin_1': (128, 0, 0),     # Dark red - danger
            'old_ruin_2': (128, 0, 0)      # Dark red - danger
        }
        r, g, b = colors.get(location_id, (100, 100, 100))
        await self.set_color(r, g, b, 150)
    
    async def handle_movement(self):
        # Subtle white pulse for movement
        await self.set_color(255, 255, 255, 100)
        await asyncio.sleep(0.2)
        await self.set_color(200, 200, 200, 80)
    
    async def handle_gossip(self):
        # Purple for gossip/secrets
        print(f"[BULB] Gossip sharing -> RGB(128, 0, 128)")
        await self.set_color(128, 0, 128, 180)
    
    async def handle_danger(self):
        # Flashing red for danger
        for _ in range(3):
            await self.set_color(255, 0, 0, 255)
            await asyncio.sleep(0.3)
            await self.set_color(0, 0, 0, 0)
            await asyncio.sleep(0.2)
    
    async def handle_conversation_tone(self, tone, intensity=1.0):
        brightness = int(150 * intensity)
        if tone == 'friendly':
            await self.set_color(0, 255, 0, brightness)
        elif tone == 'hostile':
            await self.set_color(255, 0, 0, brightness)
        elif tone == 'mysterious':
            await self.set_color(128, 0, 128, brightness)
        elif tone == 'neutral':
            await self.set_color(255, 255, 255, brightness)
    
    async def turn_off(self):
        await self.bulb.turn_off()

async def main():
    if len(sys.argv) < 2:
        return
    
    controller = GameBulbController()
    action = sys.argv[1]
    
    if action == "interact" and len(sys.argv) > 2:
        await controller.handle_interaction(sys.argv[2])
    elif action == "location" and len(sys.argv) > 2:
        await controller.handle_location(sys.argv[2])
    elif action == "movement":
        await controller.handle_movement()
    elif action == "gossip":
        await controller.handle_gossip()
    elif action == "danger":
        await controller.handle_danger()
    elif action == "tone" and len(sys.argv) > 2:
        tone = sys.argv[2]
        intensity = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
        await controller.handle_conversation_tone(tone, intensity)
    elif action == "off":
        await controller.turn_off()

if __name__ == "__main__":
    asyncio.run(main())