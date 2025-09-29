from pywizlight import wizlight, PilotBuilder
import asyncio

async def main():
    bulb = wizlight("192.168.29.79")  # Your bulb IP
    await bulb.turn_on(PilotBuilder(rgb=(55,0,0)))  # Turns red

asyncio.run(main())
