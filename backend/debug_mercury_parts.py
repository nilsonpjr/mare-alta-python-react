import requests
from bs4 import BeautifulSoup

def get_mercury_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    login_url = "https://portal.mercurymarine.com.br/epdv/epdv001.asp"
    session.get(login_url)
    login_data = {
        "sUsuar": "31240",
        "sSenha": "2105_kasa",
    }
    session.post(login_url, data=login_data)
    return session

def search_product_requests(item: str):
    print(f"Searching for part: {item}")
    session = get_mercury_session()
    url_pesquisa = f"https://portal.mercurymarine.com.br/epdv/epdv002d2.asp?s_nr_pedido_web=11111111111111111&s_nr_tabpre=&s_fm_cod_com=null&s_desc_item={item}"
    
    response = session.get(url_pesquisa)
    soup = BeautifulSoup(response.content, "html.parser")
    
    if soup.select_one(".NoRecords"):
        print("No records found.")
        with open("debug_mercury_parts_output.html", "w") as f:
            f.write(soup.prettify())
        print("Saved HTML to debug_mercury_parts_output.html")
        return []

    form_preco_item_web = soup.find("form", id="preco_item_web")
    if not form_preco_item_web:
        print("Form 'preco_item_web' not found.")
        with open("debug_mercury_parts_output.html", "w") as f:
            f.write(soup.prettify())
        return []

    try:
        first_table = form_preco_item_web.find("table")
        if not first_table:
            print("First table not found")
            return []
        tbody = first_table.find("tbody")
        if not tbody:
            print("Tbody not found")
            return []
        tr = tbody.find("tr")
        if not tr:
            print("Tr not found")
            return []
        td = tr.find("td")
        if not td:
            print("Td not found")
            return []
        tables_in_td = td.find_all("table")
        print(f"Found {len(tables_in_td)} tables in td")
        
        data_table = tables_in_td[1] if len(tables_in_td) > 1 else None
        
        if not data_table:
            print("Data table not found (second table)")
            return []

        linhas = data_table.find_all("tr", class_="Row")
        print(f"Found {len(linhas)} rows")
        
        dados = []
        for linha in linhas:
            colunas = linha.find_all("td")
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
                print(f"Found part: {dados_linha['codigo']} - {dados_linha['descricao']}")
        return dados
    except Exception as e:
        print(f"Error parsing: {e}")
        return []

if __name__ == "__main__":
    # Try a specific term to avoid SQL injection/syntax error
    search_product_requests("filtro")
