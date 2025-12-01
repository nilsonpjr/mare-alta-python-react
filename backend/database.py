"""
Este arquivo configura a conexão com o banco de dados e gerencia as sessões do SQLAlchemy.
Ele é responsável por:
1. Carregar variáveis de ambiente.
2. Definir a URL do banco de dados.
3. Criar o "engine" do SQLAlchemy.
4. Criar uma classe de sessão para interagir com o DB.
5. Fornecer uma dependência para injeção de sessão do DB no FastAPI.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv # Biblioteca para carregar variáveis de ambiente de um arquivo .env

# Carrega as variáveis de ambiente do arquivo .env.
load_dotenv()

# Define a URL do banco de dados.
# Tenta obter a URL da variável de ambiente "DATABASE_URL".
# Se não estiver definida, usa SQLite com um arquivo local "mare_alta.db" por padrão.
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mare_alta.db")

# Cria o "engine" do SQLAlchemy.
# O engine é o ponto de partida para qualquer interação com o banco de dados.
# Para SQLite, 'check_same_thread': False é necessário para permitir que múltiplos threads
# acessem a mesma conexão de banco de dados, o que é comum em aplicações web.
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Cria uma classe SessionLocal.
# Instâncias dessa classe serão nossas sessões de banco de dados.
# autocommit=False: não confirma transações automaticamente.
# autoflush=False: não descarrega operações para o DB automaticamente após cada query.
# bind=engine: associa a sessão ao engine criado.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos declarativos do SQLAlchemy.
# Todos os modelos de tabelas devem herdar desta classe.
Base = declarative_base()

# Função de dependência para obter a sessão do banco de dados.
# Esta função pode ser injetada em endpoints do FastAPI.
# Ela garante que uma nova sessão seja criada para cada requisição e que seja fechada
# corretamente após o processamento, mesmo em caso de erro.
def get_db():
    db = SessionLocal() # Cria uma nova sessão de banco de dados.
    try:
        yield db # Retorna a sessão para o bloco que a chamou (endpoint do FastAPI).
    finally:
        db.close() # Garante que a sessão seja fechada, liberando os recursos.
