from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ClienteCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    correo: EmailStr


class ClienteActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=2, max_length=100)
    correo: EmailStr | None = None


class ClienteRespuesta(ClienteCrear):
    model_config = ConfigDict(from_attributes=True)
    id: int


class ProductoCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    precio: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    stock: int = Field(ge=0)


class ProductoRespuesta(ProductoCrear):
    id: int


class ItemPedido(BaseModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(gt=0)


class PedidoCrear(BaseModel):
    cliente_id: int = Field(gt=0)
    items: list[ItemPedido] = Field(min_length=1)


class PedidoResumen(BaseModel):
    id: int
    cliente_id: int
    estado: Literal["pendiente", "confirmado", "cancelado"]
    total: Decimal

