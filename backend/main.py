from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.auth import router as auth_router
from routers.password import password
from routers.vaults import vaults
from database import engine, Base

# Importar todos los modelos para que SQLAlchemy los conozca
import models.user
import models.vault
import models.password

# Crear las tablas automáticamente si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AChave Backend",
    description="Backend de AChave.",
    version="0.1.0",
)

# Configurar CORS (Cross-Origin Resource Sharing)
# Permite que el frontend (puerto 3000) pueda hacer peticiones al backend sin que el navegador bloquee la opción OPTIONS (Preflight)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos (GET, POST, OPTIONS, etc)
    allow_headers=["*"],  # Permite todas las cabeceras (Content-Type, Authorization, etc)
)

app.include_router(password)
app.include_router(vaults)
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Esta corriendo"
    }
