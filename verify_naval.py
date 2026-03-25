import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # On définit la taille de la fenêtre
        context = await browser.new_context(record_video_dir="verification/video/", viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        print("Navigation vers le jeu...")
        await page.goto("http://localhost:8080/index.html")
        await page.wait_for_timeout(2000)

        # On simule un clic pour créer la capitale
        print("Sélection du spawn (terre)...")
        await page.mouse.click(640, 360) # Centre de l'écran
        await page.wait_for_timeout(500)

        # Le bouton s'appelle peut-être #startGameBtn ou similiare. Je vais cliquer via xpath ou eval
        print("Démarrage du jeu via evaluate...")
        await page.evaluate("document.getElementById('startGameBtn') ? document.getElementById('startGameBtn').click() : null")

        print("Attente de 3 secondes pour accumuler des troupes...")
        await page.wait_for_timeout(3000)

        # On attaque loin dans l'océan
        print("Attaque vers l'océan (pour tester la vitesse navale)...")
        await page.mouse.click(800, 600) # Clic dans l'eau
        await page.mouse.click(640, 200) # Clic sur une autre zone

        # On attend pour voir l'expansion
        print("Observation de l'expansion...")
        await page.wait_for_timeout(5000)

        await page.screenshot(path="verification/naval_final.png")
        print("Terminé.")
        await context.close()
        await browser.close()

asyncio.run(run())
