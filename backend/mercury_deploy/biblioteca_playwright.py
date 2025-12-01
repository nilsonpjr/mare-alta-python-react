from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import asyncio

async def conecta_login_playwright():
    p = await async_playwright().start()
    browser = await p.chromium.launch(headless=True)
    page = await browser.new_page()

    login = 31240
    senha = "2105_kasa"

    await page.goto("https://portal.mercurymarine.com.br/epdv/epdv001.asp")
    await page.fill("input[name=\"sUsuar\"]", str(login))
    await page.fill("input[name=\"sSenha\"]", senha)
    await page.press("input[name=\"sSenha\"]", "Enter")
    await page.wait_for_load_state()
    return page, browser, p # Retorna p para que possa ser fechado no final

async def dados_cliente_playwright(nro_motor):
    page, browser, p = await conecta_login_playwright()
    await page.goto(f"https://portal.mercurymarine.com.br/epdv/ewr010c.asp?s_nr_serie={nro_motor}")
    await page.wait_for_selector("#warranty_clients") # Espera o elemento da tabela carregar
    
    content = await page.content()
    soup = BeautifulSoup(content, "html.parser")
    
    nome_cli_element = soup.select_one("#warranty_clients table tbody tr:nth-of-type(3)")
    nome_cli = nome_cli_element.get_text(strip=True) if nome_cli_element else ""
    
    await browser.close()
    await p.stop() # Fecha o playwright context
    return nome_cli.replace("NOME ", "").strip()

async def ConsultaGarantia_playwright(nro_motor):
    page, browser, p = await conecta_login_playwright()
    await page.goto(f"https://portal.mercurymarine.com.br/epdv/ewr010.asp?s_nr_serie={nro_motor}")
    await page.wait_for_load_state()
    # O seletor original era muito específico, vamos tentar um mais robusto ou esperar pelo texto
    # await page.wait_for_selector("body > table > tbody > tr > td > table:nth-child(1) > tbody > tr > td:nth-child(2) > strong > font")
    
    content = await page.content()
    soup = BeautifulSoup(content, "html.parser")

    # Tentar encontrar o texto do número do motor na página
    teste_element = soup.find(text=lambda text: text and nro_motor.upper() in text.upper())
    teste = teste_element.strip() if teste_element else ""

    if teste.upper() != nro_motor.upper():
        print("Nenhum Motor encontrado para esse número de série!")
        await browser.close()
        await p.stop()
        return "<h1> Nenhum Motor encontrado para esse numero de serie!</h1>"
    else:
        print("Sucesso! Motor encontrado")
        # Seletores CSS ajustados com base na inspeção do HTML original
        nro_serie = soup.select_one("#warr_cardnr_serie_1").get_text(strip=True)
        modelo = soup.select_one("body > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2)").get_text(strip=True)
        dt_venda = soup.select_one("body > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(3)").get_text(strip=True)
        status_garantia = soup.select_one("body > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(5)").get_text(strip=True)
        vld_garantia = soup.select_one("body > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(6)").get_text(strip=True)
        
        nome_cli = await dados_cliente_playwright(nro_motor)

        dados_pesq = {
            "nro_motor": nro_motor,
            "nro_serie": nro_serie,
            "modelo": modelo.replace("\n", ""),
            "dt_venda": dt_venda,
            "status_garantia": status_garantia,
            "vld_garantia": vld_garantia,
            "nome_cli": nome_cli,
        }
        await browser.close()
        await p.stop()
        return dados_pesq

