import requests
from bs4 import BeautifulSoup

def check_no_login():
    print("Tentando acessar página protegida SEM login...")
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    
    protected_url = "https://portal.mercurymarine.com.br/epdv/epdv000.asp"
    resp = session.get(protected_url)
    print(f"Status: {resp.status_code}")
    print(f"URL Final: {resp.url}")
    
    soup = BeautifulSoup(resp.content, "html.parser")
    title = soup.title.string if soup.title else "Sem Título"
    print(f"Título da Página: {title}")

if __name__ == "__main__":
    check_no_login()
