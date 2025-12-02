import requests

def debug_session():
    print("Depurando sessão Mercury...")
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    
    login_url = "https://portal.mercurymarine.com.br/epdv/epdv001.asp"
    
    # 1. GET inicial
    resp_get = session.get(login_url)
    print(f"Cookies após GET inicial: {session.cookies.get_dict()}")
    
    # 2. POST login
    login_data = {
        "sUsuar": "31240",
        "sSenha": "2105_kasa",
    }
    resp_post = session.post(login_url, data=login_data)
    print(f"Cookies após POST login: {session.cookies.get_dict()}")
    
    # 3. Busca
    search_url = "https://portal.mercurymarine.com.br/epdv/epdv002d2.asp?s_nr_pedido_web=11111111111111111&s_nr_tabpre=&s_fm_cod_com=null&s_desc_item=filtro"
    resp_search = session.get(search_url)
    print(f"Cookies após Busca: {session.cookies.get_dict()}")
    
    if "NoRecords" in resp_search.text:
        print("Resultado: NoRecords encontrado.")
    else:
        print("Resultado: Parece que encontrou algo (ou erro diferente).")

if __name__ == "__main__":
    debug_session()
