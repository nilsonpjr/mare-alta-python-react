import requests
from bs4 import BeautifulSoup

def debug_mercury_requests(nro_motor):
    session = requests.Session()
    
    # 1. Login
    login_url = "https://portal.mercurymarine.com.br/epdv/epdv001.asp"
    print(f"Accessing login page: {login_url}")
    
    # Get the page first to get cookies
    response = session.get(login_url)
    print(f"Initial response: {response.status_code}")
    
    # Prepare login data
    login_data = {
        "sUsuar": "31240",
        "sSenha": "2105_kasa",
        # Add other hidden fields if necessary. 
        # Usually ASP forms might have hidden fields, but let's try simple first.
    }
    
    # Post login
    print("Submitting login...")
    response = session.post(login_url, data=login_data)
    print(f"Login response: {response.status_code}")
    
    # 2. Search Warranty
    search_url = f"https://portal.mercurymarine.com.br/epdv/ewr010.asp?s_nr_serie={nro_motor}"
    print(f"Searching warranty: {search_url}")
    response = session.get(search_url)
    print(f"Search response: {response.status_code}")
    
    soup = BeautifulSoup(response.content, "html.parser")
    
    # Check for serial
    if nro_motor.upper() in soup.get_text().upper():
        print("SUCCESS: Found serial number in text!")
        
        with open("debug_success.html", "wb") as f:
            f.write(response.content)
        print("Saved HTML to debug_success.html")
        
        # Try to extract data
        try:
            nro_serie = soup.select_one("#warr_cardnr_serie_1").get_text(strip=True)
            print(f"Serial: {nro_serie}")
            
            modelo = soup.select_one("body > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2)").get_text(strip=True)
            print(f"Modelo: {modelo}")
        except Exception as e:
            print(f"Error extracting data: {e}")
            
    else:
        print("FAILED: Serial number not found in response text.")
        with open("debug_requests.html", "wb") as f:
            f.write(response.content)
        print("Saved HTML to debug_requests.html")

if __name__ == "__main__":
    debug_mercury_requests("3B221633")
