import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

async def debug_mercury(nro_motor):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            ignore_https_errors=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        print(f"Navigating to login page...")
        await page.goto("https://portal.mercurymarine.com.br/epdv/epdv001.asp")
        await page.fill("input[name=\"sUsuar\"]", "31240")
        await page.fill("input[name=\"sSenha\"]", "2105_kasa")
        await page.press("input[name=\"sSenha\"]", "Enter")
        await page.wait_for_load_state()
        print("Login submitted.")

        print(f"Searching for serial: {nro_motor}")
        await page.goto(f"https://portal.mercurymarine.com.br/epdv/ewr010.asp?s_nr_serie={nro_motor}")
        await page.wait_for_load_state()
        
        content = await page.content()
        soup = BeautifulSoup(content, "html.parser")
        
        # Debug: Print title or some text to confirm where we are
        print(f"Page Title: {await page.title()}")
        
        # Check for the serial number in the text
        teste_element = soup.find(text=lambda text: text and nro_motor.upper() in text.upper())
        if teste_element:
            print(f"Found serial in text: {teste_element.strip()}")
        else:
            print("Serial NOT found in text.")
            # Save HTML for inspection
            with open("debug_mercury.html", "w") as f:
                f.write(content)
            print("Saved HTML to debug_mercury.html")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_mercury("3B221633"))
