# Estágio 1: Build do Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Estágio 2: Backend com Playwright (Imagem Oficial)
# Usamos a imagem oficial que já contém Python e os navegadores instalados.
FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

WORKDIR /app

# A imagem oficial já tem as dependências de sistema necessárias.
# Apenas instalamos curl/wget se necessário (geralmente já tem).
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements e instalar dependências Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Browsers já estão instalados na imagem, não precisamos rodar playwright install

# Copiar código do backend
COPY backend/ .

# Copiar o frontend buildado do estágio 1
COPY --from=frontend-build /app/frontend/dist /frontend/dist

# Expor porta
EXPOSE 8000

# Comando de inicialização
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
