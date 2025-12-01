FROM python:3.9-slim-buster

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instalar as dependências do sistema para o Playwright
# As dependências exatas podem variar, mas estas são comuns para Debian/Ubuntu
RUN apt-get update && apt-get install -y \
    libgtk-4-1 \
    libgraphene-1.0-0 \
    libatomic1 \
    libwoff2-1.0-0 \
    libevent-2.1-7 \
    libgstgl-1.0-0 \
    libgstcodecparsers-1.0-0 \
    libwebpdemux2 \
    libavif13 \
    libenchant-2-2 \
    libsecret-1-0 \
    libmanette-0.2-0 \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Instalar os navegadores do Playwright
RUN python3 -m playwright install --with-deps

COPY . .

# Definir a porta que a aplicação irá escutar
ENV PORT 8000
EXPOSE 8000

# Comando para rodar a aplicação com Gunicorn
CMD exec gunicorn --bind 0.0.0.0:$PORT app_playwright:app

