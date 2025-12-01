from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os

# Database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./mare_alta.db"

def check_data():
    if not os.path.exists("./mare_alta.db"):
        print("ERROR: mare_alta.db file not found!")
        return

    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print("--- Database Check ---")
        
        # Check Users
        users = db.execute(text("SELECT count(*) FROM users")).scalar()
        print(f"Users: {users}")
        
        # Check Boats
        boats = db.execute(text("SELECT count(*) FROM boats")).scalar()
        print(f"Boats: {boats}")
        
        # Check Orders
        orders = db.execute(text("SELECT count(*) FROM service_orders")).scalar()
        print(f"Service Orders: {orders}")
        
        # Check Parts
        parts = db.execute(text("SELECT count(*) FROM parts")).scalar()
        print(f"Parts: {parts}")

    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
