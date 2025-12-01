import requests

BASE_URL = "http://localhost:8000/api"

def check_api():
    print(f"Testing API at {BASE_URL}")
    
    # 1. Login
    print("1. Logging in as admin...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", data={
            "username": "admin@marealta.com",
            "password": "123456"
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} - {resp.text}")
            return
            
        data = resp.json()
        token = data.get("access_token") or data.get("accessToken")
        print(f"Login success! Token obtained.")
        
        # 2. Get Orders
        print("2. Fetching orders...")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/orders", headers=headers)
        
        if resp.status_code != 200:
            print(f"Get Orders failed: {resp.status_code} - {resp.text}")
            return
            
        orders = resp.json()
        print(f"Type: {type(orders)}")
        print(f"Content: {orders}")
        # print("First order sample:", orders[0] if orders else "None")
        # for o in orders:
        #     print(f" - Order #{o['id']}: {o['description']} ({o['status']})")
            
    except Exception as e:
        print(f"API Check failed: {e}")

if __name__ == "__main__":
    check_api()
