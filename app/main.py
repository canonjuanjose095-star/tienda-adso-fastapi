from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routers import clientes, pedidos, productos, reportes

app = FastAPI(
    title="Taller 3 ADSO - Tienda",
    version="3.0.0",
    description=(
        "API relacional para clientes, productos y pedidos. "
        "Los pedidos actualizan el inventario dentro de una transacción."
    ),
)

app.include_router(clientes.router)
app.include_router(productos.router)
app.include_router(pedidos.router)
app.include_router(reportes.router)

STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", tags=["Inicio"], include_in_schema=False)
def inicio() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health", tags=["Inicio"])
def health() -> dict[str, str]:
    return {"estado": "ok"}
