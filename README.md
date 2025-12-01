# Mare Alta Náutica - Python Backend

Sistema de gestão náutica com backend em Python (FastAPI) e frontend em React.

## Estrutura do Projeto

```
mare-alta-python/
├── backend/          # API Python (FastAPI)
└── frontend/         # React App
```

## Tecnologias

### Backend
- Python 3.9+
- FastAPI
- SQLAlchemy
- SQLite (dev) / PostgreSQL (prod)
- JWT Authentication

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS

## Como Executar

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Documentação

- Backend API: http://localhost:8000/docs (Swagger)
- Frontend: http://localhost:5173

## Autor

Mare Alta Náutica Manager v3.0
# mare-alta-python-react
# mare-alta-python-react
