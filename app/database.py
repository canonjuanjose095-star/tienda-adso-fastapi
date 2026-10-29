"""Conexión MySQL/MariaDB y contexto transaccional compartido."""

import os
from contextlib import contextmanager
from typing import Iterator

import pymysql
from dotenv import load_dotenv

load_dotenv()


@contextmanager
def conectar() -> Iterator[pymysql.connections.Connection]:
    """Abre una conexión; confirma al salir o revierte ante cualquier error."""
    required = ("DB_USER", "DB_PASSWORD")
    missing = [name for name in required if name not in os.environ]
    if missing:
        raise RuntimeError(
            f"Faltan variables {', '.join(missing)}. Configure el archivo .env."
        )

    conexion = pymysql.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
        database=os.getenv("DB_NAME", "tienda_adso"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
        connect_timeout=10,
    )
    try:
        yield conexion
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        conexion.close()
