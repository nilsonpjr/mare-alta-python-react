
import os
import sqlite3
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Load Supabase Connection String
load_dotenv()
PG_URL = os.getenv("DATABASE_URL")

if not PG_URL or "postgresql" not in PG_URL:
    print("Erro: DATABASE_URL não configurada ou inválida (não é Postgres).")
    exit(1)

SQLITE_DB = "mare_alta.db"

# Map Tables and Columns
# We will read from SQLite and insert into Postgres manually to ensure IDs are preserved
tables = [
    "users",
    "clients",
    "marinas",
    "boats",
    "engines",
    "parts",
    "service_orders",
    "service_items",
    "order_notes",
    "transactions",
    "stock_movements",
    "manufacturers",
    "models",
    "company_info"
]

def migrate():
    print("--- Iniciando Migração para Supabase ---")
    
    # 1. Connect SQLite
    try:
        sqlite_conn = sqlite3.connect(SQLITE_DB)
        sqlite_conn.row_factory = sqlite3.Row
        sqlite_cursor = sqlite_conn.cursor()
    except Exception as e:
        print(f"Erro ao conectar no SQLite: {e}")
        return

    # 2. Connect Postgres & Create Tables
    try:
        print("Criando tabelas no Supabase...")
        from sqlalchemy import create_engine
        import models
        # Create a temporary engine just for creation using the PG_URL
        pg_engine = create_engine(PG_URL)
        models.Base.metadata.create_all(bind=pg_engine)
        print("Tabelas criadas com sucesso.")

        pg_conn = psycopg2.connect(PG_URL)
        pg_cursor = pg_conn.cursor()
    except Exception as e:
        print(f"Erro ao conectar no Postgres: {e}")
        return

    # 3. Migrate Data
    for table in tables:
        print(f"Migrando tabela: {table}...")
        
        # Get data from SQLite
        try:
            sqlite_cursor.execute(f"SELECT * FROM {table}")
            rows = sqlite_cursor.fetchall()
            
            if not rows:
                print(f"  - Tabela vazia, pulando.")
                continue

            # Get columns
            columns = rows[0].keys()
            cols_str = ",".join(columns)
            placeholders = ",".join(["%s"] * len(columns))
            
            # Convert rows to list of values
            data = [tuple(row) for row in rows]
            
            # Insert into Postgres
            # We use ON CONFLICT DO NOTHING to avoid crashing on duplicate runs
            query = f"INSERT INTO {table} ({cols_str}) VALUES %s ON CONFLICT (id) DO NOTHING"
            
            # Handling tables without 'id' as primary key if any (company_info usually has id=1)
            if table == "company_info":
                 query = f"INSERT INTO {table} ({cols_str}) VALUES %s"

            execute_values(pg_cursor, query, data)
            print(f"  - {len(data)} registros migrados.")
            
            # Reset Sequence (Vital for Postgres SERIAL)
            if table != "company_info": # company_info might not have serial or is singleton
                pg_cursor.execute(f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), coalesce(max(id), 1)) FROM {table};")

        except Exception as e:
            print(f"  - Erro ao migrar tabela {table}: {e}")
            pg_conn.rollback() # Rollback on error
            continue

    # Commit
    pg_conn.commit()
    print("--- Migração Concluída com Sucesso ---")
    
    sqlite_conn.close()
    pg_conn.close()

if __name__ == "__main__":
    # Check confirmation
    confirm = input("Isso irá sobrescrever dados no Supabase se houver conflito de IDs. Continuar? (y/n): ")
    if confirm.lower() == 'y':
        migrate()
    else:
        print("Cancelado.")
