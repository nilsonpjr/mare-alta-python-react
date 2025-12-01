# Permite importar routers diretamente do pacote routers

from .auth_router import router as auth_router
from .orders_router import router as orders_router
from .inventory_router import router as inventory_router

__all__ = ["auth_router", "orders_router", "inventory_router"]
