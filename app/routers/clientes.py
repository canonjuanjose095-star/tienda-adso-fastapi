from fastapi import APIRouter, HTTPException
from pymysql.err import IntegrityError

from app.database import conectar
from app.schemas import ClienteActualizar, ClienteCrear, ClienteRespuesta

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("", response_model=list[ClienteRespuesta])
def listar() -> list[dict]:
    with conectar() as db, db.cursor() as cur:
        cur.execute("SELECT id, nombre, correo FROM clientes ORDER BY id")
        return cur.fetchall()


@router.get("/{cliente_id}", response_model=ClienteRespuesta)
def obtener(cliente_id: int) -> dict:
    with conectar() as db, db.cursor() as cur:
        cur.execute("SELECT id, nombre, correo FROM clientes WHERE id=%s", (cliente_id,))
        cliente = cur.fetchone()
    if cliente is None:
        raise HTTPException(404, "Cliente no encontrado")
    return cliente


@router.get("/{cliente_id}/pedidos")
def pedidos_cliente(cliente_id: int) -> list[dict]:
    with conectar() as db, db.cursor() as cur:
        cur.execute("SELECT id FROM clientes WHERE id=%s", (cliente_id,))
        if cur.fetchone() is None:
            raise HTTPException(404, "Cliente no encontrado")
        cur.execute(
            """SELECT p.id, p.fecha, p.estado, p.total, c.nombre AS cliente
               FROM pedidos p JOIN clientes c ON c.id=p.cliente_id
               WHERE p.cliente_id=%s ORDER BY p.fecha DESC, p.id DESC""",
            (cliente_id,),
        )
        return cur.fetchall()


@router.post("", response_model=ClienteRespuesta, status_code=201)
def crear(datos: ClienteCrear) -> dict:
    try:
        with conectar() as db, db.cursor() as cur:
            cur.execute(
                "INSERT INTO clientes (nombre, correo) VALUES (%s, %s)",
                (datos.nombre.strip(), str(datos.correo)),
            )
            cur.execute("SELECT id, nombre, correo FROM clientes WHERE id=%s", (cur.lastrowid,))
            return cur.fetchone()
    except IntegrityError as exc:
        raise HTTPException(409, "El correo ya está registrado") from exc


@router.put("/{cliente_id}", response_model=ClienteRespuesta)
def actualizar(cliente_id: int, datos: ClienteActualizar) -> dict:
    cambios = datos.model_dump(exclude_unset=True)
    if not cambios:
        raise HTTPException(422, "Debe enviar al menos un campo para actualizar")
    if any(value is None for value in cambios.values()):
        raise HTTPException(422, "Los campos enviados no pueden ser null")
    columnas = {"nombre": "nombre", "correo": "correo"}
    asignaciones = ", ".join(f"{columnas[campo]}=%s" for campo in cambios)
    valores = [str(v) if campo == "correo" else v.strip() for campo, v in cambios.items()]
    try:
        with conectar() as db, db.cursor() as cur:
            cur.execute("SELECT id FROM clientes WHERE id=%s", (cliente_id,))
            if cur.fetchone() is None:
                raise HTTPException(404, "Cliente no encontrado")
            cur.execute(f"UPDATE clientes SET {asignaciones} WHERE id=%s", (*valores, cliente_id))
            cur.execute("SELECT id, nombre, correo FROM clientes WHERE id=%s", (cliente_id,))
            return cur.fetchone()
    except IntegrityError as exc:
        raise HTTPException(409, "El correo ya está registrado") from exc


@router.delete("/{cliente_id}", status_code=204)
def eliminar(cliente_id: int) -> None:
    try:
        with conectar() as db, db.cursor() as cur:
            cur.execute("DELETE FROM clientes WHERE id=%s", (cliente_id,))
            if cur.rowcount == 0:
                raise HTTPException(404, "Cliente no encontrado")
    except IntegrityError as exc:
        raise HTTPException(409, "No se puede eliminar un cliente que tiene pedidos") from exc
