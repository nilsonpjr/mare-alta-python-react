from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
import asyncio

async def pesqpreco_playwright(item):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Login
        await page.goto("https://portal.mercurymarine.com.br/epdv/epdv001.asp")
        await page.fill("input[name=\"sUsuar\"]", "31240")
        await page.fill("input[name=\"sSenha\"]", "2105_kasa")
        await page.press("input[name=\"sSenha\"]", "Enter")
        await page.wait_for_load_state()

        # Navegar para a página de pesquisa
        url_pesquisa = f"https://portal.mercurymarine.com.br/epdv/epdv002d2.asp?s_nr_pedido_web=11111111111111111&s_nr_tabpre=&s_fm_cod_com=null&s_desc_item={item}"
        await page.goto(url_pesquisa)
        await page.wait_for_load_state()

        # Verificar se há resultados
        no_records_element = await page.query_selector(".NoRecords")
        if no_records_element:
            print("Nenhum registro encontrado - favor verificar !")
            await browser.close()
            return []
        else:
            print("Sucesso! item encontrado")

        # Extrair dados da tabela
        html_content = await page.content()
        soup = BeautifulSoup(html_content, "html.parser")
        
        # A tabela de dados real está aninhada dentro de um formulário com id="preco_item_web".
        # Dentro deste formulário, há uma estrutura de tabelas aninhadas.
        # A tabela que contém os dados reais (linhas com class="Row") é a segunda tabela dentro do primeiro <td>
        # que é filho do <tr> que é filho do <tbody> da primeira tabela dentro do formulário.
        
        form_preco_item_web = soup.find("form", id="preco_item_web")
        if not form_preco_item_web:
            print("Formulário com id=\'preco_item_web\' não encontrado.")
            await browser.close()
            return []

        # Encontrar a primeira tabela dentro do formulário
        first_table_in_form = form_preco_item_web.find("table")
        if not first_table_in_form:
            print("Primeira tabela dentro do formulário não encontrada.")
            await browser.close()
            return []

        # Encontrar o tbody, tr, td dentro da primeira tabela
        tbody = first_table_in_form.find("tbody")
        if not tbody:
            print("Tbody da primeira tabela não encontrado.")
            await browser.close()
            return []
        tr = tbody.find("tr")
        if not tr:
            print("Tr da primeira tabela não encontrado.")
            await browser.close()
            return []
        td = tr.find("td")
        if not td:
            print("Td da primeira tabela não encontrado.")
            await browser.close()
            return []

        # A tabela de dados é a segunda tabela dentro deste td
        tables_in_td = td.find_all("table")
        data_table = tables_in_td[1] if len(tables_in_td) > 1 else None
        
        if not data_table:
            print("Tabela de dados interna não encontrada.")
            await browser.close()
            return []

        linhas = data_table.find_all("tr", class_="Row") # Pegar apenas as linhas de dados
        
        dados = []
        for linha in linhas:
            colunas = linha.find_all("td")
            # Ajustar os índices das colunas com base na inspeção do HTML
            # 0: input (quantidade)
            # 1: 33395 (código)
            # 2: 1 (unidade por lote)
            # 3: JUNTA @2 27 (nome/descrição)
            # 4: +10 (saldo)
            # 5: R$ 171,83 (preço tabela)
            # 6: (preço base - vazio)
            # 7: R$ 103,10 (preço compra)
            # 8: input (total item - vazio)
            
            if len(colunas) >= 8:
                dados_linha = {
                    "codigo": colunas[1].text.strip(),
                    "qtd": colunas[2].text.strip(),
                    "descricao": colunas[3].text.strip(),
                    "qtdaEst": colunas[4].text.strip(),
                    "valorVenda": colunas[5].text.strip(), 
                    "valorTabela": colunas[6].text.strip(), 
                    "valorCusto": colunas[7].text.strip(),
                }
                dados.append(dados_linha)

        await browser.close()
        return dados

