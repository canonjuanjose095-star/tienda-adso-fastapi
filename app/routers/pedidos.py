from decimal import Decimal

from fastapi import APIRouter, HTTPException

from app.database import conectar
from app.schemas import PedidoCrear

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.post("", status_code=201)
def crear(datos: PedidoCrear) -> dict:
    """Crea encabezado/detalles y descuenta existencias en una sola transacción."""
    if len({item.producto_id for item in datos.items}) != len(datos.items):
        raise HTTPException(422, "No repita el mismo producto en un pedido")

    with conectar() as db, db.cursor() as cur:
        cur.execute("SELECT id FROM clientes WHERE id=%s", (datos.cliente_id,))
        if cur.fetchone() is None:
            raise HTTPException(404, "Cliente no encontrado")

        items = sorted(datos.items, key=lambda item: item.producto_id)
        detalles: list[tuple[int, int, Decimal, Decimal]] = []
        total = Decimal("0.00")
        for item in items:
            cur.execute(
                "SELECT id, nombre, precio, stock FROM productos WHERE id=%s FOR UPDATE",
                (item.producto_id,),
            )
            producto = cur.fetchone()
            if producto is None:
                raise HTTPException(404, f"Producto {item.producto_id} no encontrado")
            if producto["stock"] < item.cantidad:
                raise HTTPException(409, f"Stock insuficiente del producto {item.producto_id}")
            precio = producto["precio"]
            subtotal = precio * item.cantidad
            total += subtotal
            detalles.append((item.producto_id, item.cantidad, precio, subtotal))

        cur.execute(
            "INSERT INTO pedidos (cliente_id, estado, total) VALUES (%s, 'confirmado', %s)",
            (datos.cliente_id, total),
        )
        pedido_id = cur.lastrowid
        for producto_id, cantidad, precio, subtotal in detalles:
            cur.execute(
                """INSERT INTO detalle_pedidos
                   (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
                   VALUES (%s, %s, %s, %s, %s)""",
                (pedido_id, producto_id, cantidad, precio, subtotal),
            )
            cur.execute(
                "UPDATE productos SET stock=stock-%s WHERE id=%s",
                (cantidad, producto_id),
            )
    return {
        "id": pedido_id,
        "cliente_id": datos.cliente_id,
        "estado": "confirmado",
        "total": str(total),
        "items": len(detalles),
    }


@router.get("")
def listar() -> list[dict]:
    with conectar() as db, db.cursor() as cur:
        cur.execute(
            """SELECT p.id, p.cliente_id, p.fecha, p.estado, p.total,
                      c.nombre AS cliente
               FROM pedidos p JOIN clientes c ON c.id=p.cliente_id
               ORDER BY p.id DESC"""
        )
        return cur.fetchall()


@router.get("/{pedido_id}")
def detalle(pedido_id: int) -> dict:
    with conectar() as db, db.cursor() as cur:
        cur.execute(
            """SELECT p.id, p.cliente_id, p.fecha, p.estado, p.total,
                      c.nombre AS cliente
               FROM pedidos p JOIN clientes c ON c.id=p.cliente_id WHERE p.id=%s""",
            (pedido_id,),
        )
        pedido = cur.fetchone()
        if pedido is None:
            raise HTTPException(404, "Pedido no encontrado")
        cur.execute(
            """SELECT d.producto_id, pr.nombre AS producto, d.cantidad,
                      d.precio_unitario, d.subtotal
               FROM detalle_pedidos d JOIN productos pr ON pr.id=d.producto_id
               WHERE d.pedido_id=%s ORDER BY d.id""",
            (pedido_id,),
        )
        pedido["items"] = cur.fetchall()
        return pedido


@router.post("/{pedido_id}/cancelar")
def cancelar(pedido_id: int) -> dict:
    """Cancela una sola vez y devuelve cada cantidad al inventario atómicamente."""
    with conectar() as db, db.cursor() as cur:
        cur.execute("SELECT id, estado FROM pedidos WHERE id=%s FOR UPDATE", (pedido_id,))
        pedido = cur.fetchone()
        if pedido is None:
            raise HTTPException(404, "Pedido no encontrado")
        if pedido["estado"] == "cancelado":
            raise HTTPException(409, "El pedido ya fue cancelado")
        if pedido["estado"] != "confirmado":
            raise HTTPException(409, "Solo se pueden cancelar pedidos confirmados")

        cur.execute(
            "SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id=%s ORDER BY producto_id",
            (pedido_id,),
        )
        for item in cur.fetchall():
            cur.execute(
                "UPDATE productos SET stock=stock+%s WHERE id=%s",
                (item["cantidad"], item["producto_id"]),
            )
        cur.execute("UPDATE pedidos SET estado='cancelado' WHERE id=%s", (pedido_id,))
    return {"id": pedido_id, "estado": "cancelado", "mensaje": "Existencias devueltas"}
