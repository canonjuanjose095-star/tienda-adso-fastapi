from fastapi import FastAPI

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


@app.get("/", tags=["Inicio"])
def inicio() -> dict[str, str]:
    return {"mensaje": "API tienda ADSO", "documentacion": "/docs"}


@app.get("/health", tags=["Inicio"])
def health() -> dict[str, str]:
    return {"estado": "ok"}
