from fastapi import FastAPI

from routers.auth import router as auth_router
from routers.password import password
from routers.vaults import vaults

app = FastAPI(
    title="AChave Backend",
    description="Backend de AChave.",
    version="0.1.0",
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
