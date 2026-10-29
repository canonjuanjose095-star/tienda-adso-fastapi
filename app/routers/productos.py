from fastapi import APIRouter, HTTPException, Query

from app.database import conectar
from app.schemas import ProductoCrear, ProductoRespuesta

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("", response_model=list[ProductoRespuesta])
def listar(
    buscar: str | None = None,
    pagina: int = Query(1, ge=1),
    limite: int = Query(10, ge=1, le=50),
) -> list[dict]:
    sql = "SELECT id, nombre, precio, stock FROM productos"
    parametros: list = []
    if buscar:
        sql += " WHERE nombre LIKE %s"
        parametros.append(f"%{buscar}%")
    sql += " ORDER BY id LIMIT %s OFFSET %s"
    parametros.extend((limite, (pagina - 1) * limite))
    with conectar() as db, db.cursor() as cur:
        cur.execute(sql, tuple(parametros))
        return cur.fetchall()


@router.get("/{producto_id}", response_model=ProductoRespuesta)
def obtener(producto_id: int) -> dict:
    with conectar() as db, db.cursor() as cur:
        cur.execute("SELECT id, nombre, precio, stock FROM productos WHERE id=%s", (producto_id,))
        producto = cur.fetchone()
    if producto is None:
        raise HTTPException(404, "Producto no encontrado")
    return producto


@router.post("", response_model=ProductoRespuesta, status_code=201)
def crear(datos: ProductoCrear) -> dict:
    with conectar() as db, db.cursor() as cur:
        cur.execute(
            "INSERT INTO productos (nombre, precio, stock) VALUES (%s, %s, %s)",
            (datos.nombre.strip(), datos.precio, datos.stock),
        )
        cur.execute("SELECT id, nombre, precio, stock FROM productos WHERE id=%s", (cur.lastrowid,))
        return cur.fetchone()


@router.patch("/{producto_id}/stock", response_model=ProductoRespuesta)
def cambiar_stock(producto_id: int, stock: int = Query(ge=0)) -> dict:
    with conectar() as db, db.cursor() as cur:
        cur.execute("UPDATE productos SET stock=%s WHERE id=%s", (stock, producto_id))
        if cur.rowcount == 0:
            cur.execute("SELECT id FROM productos WHERE id=%s", (producto_id,))
            if cur.fetchone() is None:
                raise HTTPException(404, "Producto no encontrado")
        cur.execute("SELECT id, nombre, precio, stock FROM productos WHERE id=%s", (producto_id,))
        return cur.fetchone()
