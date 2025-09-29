from pywizlight import wizlight, PilotBuilder
from nltk.sentiment.vader import SentimentIntensityAnalyzer
import nltk
import asyncio
import sys

class EmotionBulbController:
    def __init__(self, bulb_ip="192.168.29.79"):
        """
        Initialize Wiz bulb and VADER sentiment analyzer
        """
        self.bulb = wizlight(bulb_ip)
        try:
            nltk.download('vader_lexicon', quiet=True)
        except:
            pass
        self.sid = SentimentIntensityAnalyzer()
    
    async def set_color(self, r, g, b, brightness=255):
        """
        Set bulb color with optional brightness
        """
        try:
            await self.bulb.turn_on(PilotBuilder(rgb=(r, g, b), brightness=brightness))
        except Exception as e:
            print(f"[Bulb error] {e}")
    
    def get_emotion(self, text):
        scores = self.sid.polarity_scores(text)
        compound = scores['compound']
        pos = scores['pos']
        neg = scores['neg']

        # Prioritize exclamation-based emotions
        if pos > 0.3 and "!" in text:
            return "excited"
        elif neg > 0.3 and "!" in text:
            return "angry"
        elif compound >= 0.6:
            return "happy"
        elif compound <= -0.4:
            return "sad"
        else:
            return "serious"

    def get_emotion_color(self, emotion, intensity):
        """
        Map emotion to RGB color and adjust brightness based on intensity
        """
        base_brightness = 150
        brightness = min(255, max(base_brightness, int(base_brightness + abs(intensity) * 105)))

        color_map = {
            'happy': (255, 255, 0),    # Yellow
            'sad': (0, 0, 255),        # Blue
            'excited': (255, 165, 0),  # Orange
            'angry': (255, 0, 0),      # Red
            'serious': (128, 128, 128) # Gray / Neutral
        }

        r, g, b = color_map.get(emotion, (255, 255, 255))  # Default white
        return r, g, b, brightness
    
    async def analyze_and_set_emotion(self, text):
        """
        Analyze text emotion and set bulb color
        """
        try:
            emotion = self.get_emotion(text)
            intensity = self.sid.polarity_scores(text)['compound']

            print(f"[INFO] Text: '{text}' -> Emotion: {emotion}, Intensity: {intensity:.2f}")

            r, g, b, brightness = self.get_emotion_color(emotion, intensity)
            await self.set_color(r, g, b, brightness)
        except Exception as e:
            print(f"[Emotion analysis error] {e}")
            # Fallback color
            await self.set_color(255, 255, 255, 100)

    async def turn_off(self):
        """
        Turn off the bulb safely
        """
        try:
            await self.bulb.turn_off()
        except Exception as e:
            print(f"[Bulb error] {e}")


async def main():
    if len(sys.argv) < 2:
        print("Usage: python script.py emotion <text> OR off")
        return
    
    controller = EmotionBulbController()
    action = sys.argv[1].lower()
    
    if action == "emotion" and len(sys.argv) > 2:
        text = " ".join(sys.argv[2:])
        await controller.analyze_and_set_emotion(text)
    elif action == "off":
        await controller.turn_off()
    else:
        print("Invalid command. Use 'emotion <text>' or 'off'.")


if __name__ == "__main__":
    asyncio.run(main())
