import requests
from bs4 import BeautifulSoup
import sys

# --- COPIED FROM mercury_router.py ---

def get_mercury_session():
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    login_url = "https://portal.mercurymarine.com.br/epdv/epdv001.asp"
    
    # Initial GET to set cookies
    session.get(login_url)
    
    # Login
    login_data = {
        "sUsuar": "31240",
        "sSenha": "2105_kasa",
    }
    session.post(login_url, data=login_data)
    return session

def search_warranty_requests(nro_motor: str):
    print(f"Searching for {nro_motor}...")
    session = get_mercury_session()
    url_warranty = f"https://portal.mercurymarine.com.br/epdv/ewr010.asp?s_nr_serie={nro_motor}"
    response = session.get(url_warranty)
    soup = BeautifulSoup(response.content, "html.parser")
    
    # Check if serial exists in text (robust check)
    if nro_motor.upper() not in soup.get_text().upper():
        print("Serial not found in text")
        return None

    try:
        # Extract Main Data
        row = soup.select_one("tr.Row")
        if not row:
            print("Row not found")
            return None
            
        cells = row.find_all("td")
        if len(cells) < 6:
            print(f"Not enough cells: {len(cells)}")
            return None

        nro_serie = cells[0].get_text(strip=True)
        modelo = cells[1].get_text(strip=True)
        dt_venda = cells[2].get_text(strip=True)
        status_garantia = cells[4].get_text(strip=True)
        vld_garantia = cells[5].get_text(strip=True)
        
        print(f"Found basic data: {nro_serie}")

        # Get Client Name (Secondary Request)
        url_client = f"https://portal.mercurymarine.com.br/epdv/ewr010c.asp?s_nr_serie={nro_motor}"
        resp_client = session.get(url_client)
        soup_client = BeautifulSoup(resp_client.content, "html.parser")
        
        # Client name is usually in the 3rd row of the table inside #warranty_clients div
        # But let's try a more generic approach if that fails
        nome_cli = ""
        client_table = soup_client.select_one("#warranty_clients table")
        if client_table:
            rows = client_table.find_all("tr")
            if len(rows) >= 3:
                nome_cli = rows[2].get_text(strip=True).replace("NOME ", "").strip()
        
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
        print(f"Error parsing warranty data: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    try:
        result = search_warranty_requests("3B221633")
        print("Result:", result)
    except Exception as e:
        print("CRASHED:")
        import traceback
        traceback.print_exc()
