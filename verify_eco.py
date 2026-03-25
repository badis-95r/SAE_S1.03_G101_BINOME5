import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(record_video_dir="verification/video/", viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        print("Navigation vers le jeu...")
        await page.goto("http://localhost:8080/index.html")
        await page.wait_for_timeout(2000)

        print("Sélection du spawn...")
        await page.mouse.click(640, 360)
        await page.wait_for_timeout(500)
        await page.evaluate("document.getElementById('start-btn').click()")

        print("Injection de 2000g et test ville...")
        await page.evaluate("window.gameInstance.player.gold = 2000;")

        # Click Build City btn
        await page.wait_for_timeout(1000)
        await page.click('#build-city-btn')
        await page.mouse.click(640, 360) # Capital

        print("Attente de 2 secondes pour accumuler des troupes et observer la ville...")
        await page.wait_for_timeout(2000)

        # Capture d'écran
        await page.screenshot(path="verification/eco_final.png")
        print("Terminé.")
        await context.close()
        await browser.close()

asyncio.run(run())
