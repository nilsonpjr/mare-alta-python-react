import requests
from bs4 import BeautifulSoup

def check_login():
    session = requests.Session()
    login_url = "https://portal.mercurymarine.com.br/epdv/epdv001.asp"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print("1. Getting login page...")
    resp = session.get(login_url, headers=headers)
    print(f"Status: {resp.status_code}")
    
    login_data = {
        "sUsuar": "31240",
        "sSenha": "2105_kasa",
    }
    
    print("2. Submitting credentials...")
    resp = session.post(login_url, data=login_data, headers=headers)
    print(f"Status: {resp.status_code}")
    
    # Check if we are redirected or if there's an error message
    soup = BeautifulSoup(resp.content, "html.parser")
    text = soup.get_text()
    
    if "Senha inválida" in text or "Usuário não cadastrado" in text:
        print("LOGIN FAILED: Invalid credentials message found.")
        print(text[:500])
    else:
        print("Login submission complete. Checking if session is valid...")
        # Try to access a protected page
        test_url = "https://portal.mercurymarine.com.br/epdv/epdv002d2.asp" # Search page
        resp = session.get(test_url, headers=headers)
        if "login" in resp.url.lower() or "epdv001.asp" in resp.url.lower():
             print("LOGIN FAILED: Redirected back to login page.")
        else:
             print("LOGIN SUCCESS: Accessed protected page.")

if __name__ == "__main__":
    check_login()
