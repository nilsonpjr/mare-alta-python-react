"""
Este módulo define as rotas da API para interagir com o Portal Mercury Marine.
Ele permite buscar produtos e obter informações de garantia de motores
ao realizar web scraping do portal.
"""

from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List, Optional
import sys
import os
import requests # Biblioteca para fazer requisições HTTP.
import asyncio # Para rodar funções síncronas em um threadpool.
from bs4 import BeautifulSoup # Biblioteca para parsing de HTML (web scraping).
import re # Módulo para expressões regulares.

# Adiciona o diretório pai (backend) ao sys.path para permitir importações relativas.
# Isso é necessário para importar `services.fiscal_service` de `main.py`.
# Mantido conforme estrutura existente.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Cria uma instância de APIRouter com um prefixo e tags para organização na documentação OpenAPI.
router = APIRouter(
    prefix="/api/mercury",
    tags=["Mercury"], # Tag para agrupar as rotas do Mercury na documentação.
    responses={404: {"description": "Não encontrado"}}, # Resposta padrão para 404.
)

# --- FUNÇÕES AUXILIARES ---
# Funções para realizar o web scraping e interagir com o portal Mercury.

def get_mercury_session() -> requests.Session:
    """
    Cria e autentica uma sessão HTTP com o Portal Mercury Marine.
    Retorna um objeto requests.Session autenticado.
    """
    session = requests.Session()
    # Define um User-Agent para simular um navegador real e evitar bloqueios.
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    login_url = "https://portal.mercurymarine.com.br/epdv/epdv001.asp"
    
    # Faz uma requisição GET inicial para obter os cookies de sessão.
    session.get(login_url)
    
    # Dados de login (credenciais sensíveis, idealmente carregadas de variáveis de ambiente seguras).
    login_data = {
        "sUsuar": "31240", # Usuário do portal Mercury.
        "sSenha": "2105_kasa", # Senha do portal Mercury.
    }
    # Envia os dados de login via POST para autenticar a sessão.
    session.post(login_url, data=login_data)
    return session

def search_product_requests(item: str) -> List[Dict[str, str]]:
    """
    Pesquisa produtos no Portal Mercury Marine por código ou descrição.
    Args:
        item (str): O termo de busca (código ou descrição do produto).
    Returns:
        List[Dict[str, str]]: Uma lista de dicionários contendo os dados dos produtos encontrados.
    """
    session = get_mercury_session() # Obtém uma sessão autenticada.
    # URL de pesquisa de produtos no portal.
    url_pesquisa = f"https://portal.mercurymarine.com.br/epdv/epdv002d2.asp?s_nr_pedido_web=11111111111111111&s_nr_tabpre=&s_fm_cod_com=null&s_desc_item={item}"
    response = session.get(url_pesquisa) # Realiza a requisição GET.
    
    soup = BeautifulSoup(response.content, "html.parser") # Analisa o HTML da resposta.
    
    # Verifica se a página indica "Nenhum Registro Encontrado".
    if soup.select_one(".NoRecords"):
        return [] # Retorna lista vazia se nenhum produto for encontrado.

    # Encontra o formulário principal de preços de itens.
    form_preco_item_web = soup.find("form", id="preco_item_web")
    if not form_preco_item_web:
        return []

    try:
        # Navega até a tabela de dados dos produtos (estrutura aninhada no HTML).
        first_table = form_preco_item_web.find("table")
        if not first_table:
            return []
        tbody = first_table.find("tbody")
        if not tbody:
            return []
        tr = tbody.find("tr")
        if not tr:
            return []
        td = tr.find("td")
        if not td:
            return []
        tables_in_td = td.find_all("table")
        data_table = tables_in_td[1] if len(tables_in_td) > 1 else None # A tabela de dados é a segunda dentro do td.
        
        if not data_table:
            return []

        linhas = data_table.find_all("tr", class_="Row") # Encontra todas as linhas de dados (com a classe "Row").
        dados = []
        for linha in linhas:
            colunas = linha.find_all("td") # Extrai as colunas de cada linha.
            if len(colunas) >= 8: # Verifica se há colunas suficientes.
                dados_linha = {
                    "codigo": colunas[1].text.strip(),
                    "qtd": colunas[2].text.strip(),
                    "descricao": colunas[3].text.strip(),
                    "qtdaEst": colunas[4].text.strip(), # Quantidade em estoque.
                    "valorVenda": colunas[5].text.strip(), # Valor de venda.
                    "valorTabela": colunas[6].text.strip(), # Valor de tabela.
                    "valorCusto": colunas[7].text.strip(), # Valor de custo.
                }
                dados.append(dados_linha)
        return dados
    except Exception as e:
        print(f"Erro ao analisar tabela de produtos: {e}") # Loga o erro de parsing.
        return []

def search_warranty_requests(nro_motor: str) -> Optional[Dict[str, str]]:
    """
    Busca informações de garantia de um motor Mercury pelo número de série.
    Args:
        nro_motor (str): O número de série do motor.
    Returns:
        Optional[Dict[str, str]]: Um dicionário com os dados da garantia, ou None se não encontrado.
    """
    session = get_mercury_session() # Obtém uma sessão autenticada.
    # URL para pesquisa de garantia.
    url_warranty = f"https://portal.mercurymarine.com.br/epdv/ewr010.asp?s_nr_serie={nro_motor}"
    response = session.get(url_warranty) # Realiza a requisição GET.
    soup = BeautifulSoup(response.content, "html.parser") # Analisa o HTML da resposta.
    
    # Verifica de forma robusta se o número do motor está presente no texto da página,
    # indicando que o registro foi encontrado.
    if nro_motor.upper() not in soup.get_text().upper():
        return None # Retorna None se o motor não for encontrado.

    try:
        # Extrai os dados principais da tabela de resultados da garantia.
        row = soup.select_one("tr.Row") # A primeira linha de dados tem a classe "Row".
        if not row:
            return None
            
        cells = row.find_all("td") # Extrai as células da linha.
        if len(cells) < 6: # Verifica se há células suficientes.
            return None

        nro_serie = cells[0].get_text(strip=True)
        modelo = cells[1].get_text(strip=True)
        dt_venda = cells[2].get_text(strip=True) # Data de venda.
        status_garantia = cells[4].get_text(strip=True)
        vld_garantia = cells[5].get_text(strip=True) # Validade da garantia.
        
        # --- Obter Nome do Cliente (requisição secundária) ---
        url_client = f"https://portal.mercurymarine.com.br/epdv/ewr010c.asp?s_nr_serie={nro_motor}"
        resp_client = session.get(url_client)
        soup_client = BeautifulSoup(resp_client.content, "html.parser")
        
        nome_cli = ""
        # Tenta encontrar o nome do cliente em uma estrutura específica.
        client_table = soup_client.select_one("#warranty_clients table")
        if client_table:
            rows = client_table.find_all("tr")
            if len(rows) >= 3:
                # O nome do cliente é geralmente na 3ª linha, remove "NOME " do início.
                nome_cli = rows[2].get_text(strip=True).replace("NOME ", "").strip()
        
        # Fallback mais robusto para extrair o nome do cliente usando regex,
        # caso a estrutura da tabela mude ou seja diferente.
        if not nome_cli:
            # Procura por "NOME" seguido por texto e quebra de linha.
            match = re.search(r"NOME\s+([^\n]+)", soup_client.get_text())
            if match:
                nome_cli = match.group(1).strip()


        return {
            "nro_motor": nro_motor,
            "nro_serie": nro_serie,
            "modelo": modelo,
            "dt_venda": dt_venda,
            "status_garantia": status_garantia,
            "vld_garantia": vld_garantia,
            "nome_cli": nome_cli,
        }
    except Exception as e:
        print(f"Erro ao analisar dados de garantia: {e}") # Loga o erro de parsing.
        return None

# --- ENDPOINTS ---
# Rotas da API que expõem as funcionalidades do Mercury.

@router.get("/search/{item}")
async def search_mercury_product(item: str):
    """
    Endpoint para buscar um produto no Portal Mercury Marine pelo código ou descrição.
    A requisição síncrona é executada em um threadpool para não bloquear o loop de eventos assíncrono.
    """
    try:
        # Usa `asyncio.to_thread` para executar a função síncrona `search_product_requests`
        # em um thread separado, evitando que ela bloqueie o loop de eventos principal do FastAPI.
        results = await asyncio.to_thread(search_product_requests, item)
        return {"status": "success", "results": results}
    except Exception as e:
        # Em caso de erro, levanta um HTTPException 500.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao buscar produto no Mercury: {str(e)}")

@router.get("/warranty/{serial}")
async def get_engine_warranty(serial: str):
    """
    Endpoint para obter informações de garantia de um motor Mercury pelo número de série.
    A requisição síncrona é executada em um threadpool para não bloquear o loop de eventos assíncrono.
    """
    try:
        # Usa `asyncio.to_thread` para executar a função síncrona `search_warranty_requests`
        # em um thread separado.
        result = await asyncio.to_thread(search_warranty_requests, serial)
        if result:
            return {"status": "success", "data": result}
        else:
            # Se a busca não encontrar o motor, retorna status "not_found".
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Motor não encontrado na Mercury ou sem informações de garantia")
    except HTTPException: # Re-raise HTTPException se já for um erro HTTP.
        raise
    except Exception as e:
        # Em caso de outros erros, levanta um HTTPException 500.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao buscar garantia no Mercury: {str(e)}")
