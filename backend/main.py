"""
Este é o ponto de entrada principal para a aplicação FastAPI do backend.
Ele configura a aplicação, inclui os roteadores (endpoints da API), configura o CORS
e serve os arquivos estáticos do frontend, se disponíveis.
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

# Importa os modelos de banco de dados para garantir que as tabelas sejam criadas.
import models
# Importa a configuração do banco de dados e a função para obter a sessão do DB.
from database import engine, get_db

# Importa os roteadores (grupos de endpoints) para diferentes funcionalidades da API.
# Cada roteador gerencia um conjunto específico de rotas e suas operações.
from routers.auth_router import router as auth_router
from routers.orders_router import router as orders_router
from routers.inventory_router import router as inventory_router
from routers.clients_router import router as clients_router
from routers.boats_router import router as boats_router
from routers.fiscal_router import router as fiscal_router
from routers.mercury_router import router as mercury_router
from routers.transactions_router import router as transactions_router
from routers.config_router import router as config_router

# Cria todas as tabelas definidas nos modelos (models.py) no banco de dados.
# Isso é feito apenas uma vez na inicialização da aplicação.
models.Base.metadata.create_all(bind=engine)

# Inicializa a aplicação FastAPI com um título.
app = FastAPI(title="Mare Alta API")

# Configura o Middleware CORS (Cross-Origin Resource Sharing).
# Isso permite que o frontend (executando em um domínio/porta diferente)
# faça requisições para esta API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite requisições de qualquer origem. Em produção, isso deve ser mais restritivo.
    allow_credentials=True, # Permite cookies e cabeçalhos de autorização.
    allow_methods=["*"],  # Permite todos os métodos HTTP (GET, POST, PUT, DELETE, etc.).
    allow_headers=["*"],  # Permite todos os cabeçalhos nas requisições.
)

# Inclui todos os roteadores na aplicação principal.
# Cada roteador adiciona suas próprias rotas baseadas nos prefixos definidos neles.
app.include_router(auth_router) # Roteador para autenticação de usuários (login, registro).
app.include_router(orders_router) # Roteador para gerenciamento de pedidos.
app.include_router(inventory_router) # Roteador para gerenciamento de estoque/inventário.
app.include_router(clients_router) # Roteador para gerenciamento de clientes.
app.include_router(boats_router) # Roteador para gerenciamento de embarcações.
app.include_router(fiscal_router) # Roteador para operações fiscais.
app.include_router(mercury_router) # Roteador para funcionalidades relacionadas ao Mercury.
app.include_router(transactions_router) # Roteador para gerenciamento de transações financeiras.
app.include_router(config_router) # Roteador para configurações gerais da aplicação (ex: fabricantes, modelos).


from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse # Importa JSONResponse para o erro 404

# Define o caminho para a pasta 'dist' do frontend.
# Ele sobe dois níveis do diretório atual (backend), entra em 'frontend' e depois em 'dist'.
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

# Verifica se a pasta 'dist' do frontend existe.
if os.path.exists(frontend_dist):
    # Monta a pasta 'assets' do frontend para servir arquivos estáticos como CSS, JS, imagens.
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    # Rota curinga para servir o aplicativo SPA (Single Page Application) do frontend.
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Permite que as chamadas de API do backend (e docs) passem sem serem interceptadas pelo SPA.
        # Se a rota começar com "api", "docs" ou for "openapi.json", retorna 404 (já que não é um arquivo estático).
        if full_path.startswith("api") or full_path.startswith("docs") or full_path == "openapi.json":
            return JSONResponse(status_code=404, content={"message": "Não Encontrado"})
            
        # Para qualquer outra rota, tenta servir o 'index.html' do frontend.
        # Isso é fundamental para roteamento de SPA, onde o frontend gerencia as rotas.
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        # Se 'index.html' não for encontrado, significa que o frontend não foi construído.
        return {"message": "Frontend não foi construído (dist/index.html não encontrado)."}
else:
    # Se a pasta 'dist' do frontend não existir, exibe uma mensagem no endpoint raiz.
    @app.get("/")
    def read_root():
        return {"message": "Diretório 'dist' do frontend não encontrado. Execute 'npm run build' no diretório 'frontend'."}

# Este bloco só é executado quando o script é rodado diretamente (ex: python main.py).
# Inicia o servidor Uvicorn para servir a aplicação FastAPI.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) # reload=True para recarregar automaticamente em mudanças.
