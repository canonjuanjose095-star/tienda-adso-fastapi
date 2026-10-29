# Tienda ADSO - API REST con FastAPI

Proyecto del Taller práctico N.º 3. Administra clientes, productos y pedidos con MySQL/MariaDB, validación Pydantic, consultas JOIN y transacciones InnoDB.

Repositorio GitHub: [tienda-adso-fastapi](https://github.com/canonjuanjose095-star/tienda-adso-fastapi) (privado).

## Modelo relacional

```text
clientes (1) ────< pedidos (1) ────< detalle_pedidos >──── (1) productos
```

`detalle_pedidos` representa la relación muchos-a-muchos entre pedidos y productos. Cada fila conserva cantidad, precio unitario al momento de la compra y subtotal. Las claves foráneas mantienen la integridad referencial; InnoDB y la transacción garantizan que encabezado, detalles y descuentos de inventario se confirmen o reviertan juntos.

## Estructura

```text
app/
  main.py                 Aplicación y registro de routers
  database.py             Conexión y contexto de commit/rollback
  schemas.py              Validación de entrada y salida
  static/
    index.html            Página de tienda y experiencia de compra
    styles.css            Diseño adaptable para escritorio y móvil
    app.js                Catálogo, carrito, clientes y pedidos conectados a la API
  routers/
    clientes.py           Clientes, actualización, borrado e historial
    productos.py          Catálogo, búsqueda, paginación y stock
    pedidos.py            Creación, detalle, listado y cancelación
    reportes.py           Ventas agregadas por cliente
sql/
  01_esquema.sql          Base, tablas, restricciones y claves foráneas
  02_datos_prueba.sql     Dos clientes y tres productos de ejemplo
.env.example             Plantilla sin credenciales reales
```

## Requisitos y configuración

Se necesita Python 3.10 o posterior y un servidor MySQL/MariaDB ya disponible. No se instala ni configura el servidor dentro de este proyecto.

1. En Workbench o phpMyAdmin, ejecute `sql/01_esquema.sql` con una cuenta administrativa. Cree un usuario de aplicación dedicado (la guía sugiere `api_adso`) con permisos `SELECT`, `INSERT`, `UPDATE` y `DELETE` sobre `tienda_adso.*`. No use `root` para la API.
2. Ejecute `sql/02_datos_prueba.sql` una sola vez.
3. Desde esta carpeta, cree y active el entorno, instale dependencias y prepare la configuración:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   Copy-Item .env.example .env
   ```

   Edite `.env` con el host, puerto, usuario y contraseña locales. `DB_NAME` debe ser `tienda_adso`. `.env` está excluido de Git y no forma parte del ZIP.
4. Inicie desde la raíz del proyecto:

   ```powershell
   fastapi dev app/main.py
   ```

5. Abra [http://127.0.0.1:8000/](http://127.0.0.1:8000/) para usar la página de la tienda o [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) para probar los endpoints en Swagger.

## Página web de la tienda

La aplicación sirve una tienda web adaptable desde FastAPI, sin instalar Node ni compilar recursos. La página obtiene productos, clientes y pedidos de los endpoints existentes en el mismo servidor, por lo que la disponibilidad y los precios corresponden a la base de datos. Desde el navegador se puede:

- Buscar y ordenar el catálogo; el stock disponible aparece en cada producto.
- Agregar productos al carrito y ajustar cantidades sin exceder las existencias conocidas.
- Registrar o seleccionar un cliente antes de finalizar una compra.
- Crear un pedido confirmado: el backend valida el inventario y actualiza el stock dentro de su transacción.
- Consultar pedidos recientes, ver sus líneas y totales, y cancelar un pedido para devolver el inventario según sus reglas de estado.

Para abrir la página inicia FastAPI y visita `http://127.0.0.1:8000/`. Swagger continúa disponible en `/docs`. La página no contiene datos de ejemplo propios: carga el catálogo y las compras desde MySQL por medio de la API.

## Endpoints

| Método | Ruta | Uso |
|---|---|---|
| GET | `/` | Página web de la tienda |
| GET | `/health` | Estado del proceso |
| GET, POST | `/clientes` | Listar y registrar clientes |
| GET, PUT, DELETE | `/clientes/{id}` | Consultar, actualizar o eliminar; el borrado con pedidos responde 409 |
| GET | `/clientes/{id}/pedidos` | Historial del cliente ordenado por fecha |
| GET, POST | `/productos` | Catálogo (admite `buscar`, `pagina`, `limite`) y registro |
| GET | `/productos/{id}` | Consultar producto |
| PATCH | `/productos/{id}/stock?stock=10` | Ajustar existencias |
| GET, POST | `/pedidos` | Listar y confirmar pedido transaccional |
| GET | `/pedidos/{id}` | Encabezado y detalle con JOIN |
| POST | `/pedidos/{id}/confirmar` | Confirmar un pedido pendiente y reservar stock |
| POST | `/pedidos/{id}/cancelar` | Cancelar una vez y devolver existencias |
| GET | `/reportes/ventas-por-cliente` | Conteo de pedidos y ventas confirmadas |

## Probar el flujo de la guía en Swagger

1. `GET /clientes` y `GET /productos` deben mostrar los datos iniciales.
2. `POST /clientes` con `{"nombre":"Laura Díaz","correo":"laura@example.com"}` responde 201. Repita el correo: responde 409.
3. `GET /productos?buscar=mouse` filtra el catálogo. `POST /productos` con precio negativo debe responder 422.
4. Antes de crear el pedido, consulte stock: Mouse 12, Teclado 8. Envíe a `POST /pedidos`:

   ```json
   {
     "cliente_id": 1,
     "items": [
       {"producto_id": 1, "cantidad": 2},
       {"producto_id": 2, "cantidad": 1}
     ]
   }
   ```

   El total esperado es 150000.00, el stock queda Mouse 10 y Teclado 7. Use el ID devuelto en `GET /pedidos/{id}` para observar el encabezado y sus detalles.
5. Pruebe cliente inexistente (404), producto inexistente (404) y una cantidad superior a las existencias (409). Compare pedidos y stock antes y después: en los errores no debe guardarse ninguna parte.
6. Pruebe `POST /pedidos/{id}/cancelar`: stock se devuelve y el estado cambia a cancelado. Si repite la cancelación, responde 409 y el inventario no vuelve a incrementarse.
7. Reinicie FastAPI y consulte de nuevo los recursos para verificar persistencia. Ejecute las consultas SQL de abajo y capture Swagger, la respuesta de pedido, JOIN, stock anterior/posterior y rollback para la evidencia del taller.

## Probar la tienda en el navegador

1. Inicia FastAPI y abre `http://127.0.0.1:8000/`. El catálogo muestra los productos que devuelve MySQL; usa el buscador y el selector de orden para explorar.
2. Agrega un Mouse al carrito y comprueba que el contador cambie. Usa `+` y `−` para ajustar la cantidad; el sitio no permite superar el stock que muestra el catálogo.
3. En el carrito selecciona un cliente existente o pulsa `+` para registrar uno nuevo. Si intentas guardar un correo duplicado, se muestra el error del servidor y no se crea otro cliente.
4. Pulsa **Finalizar pedido**. La web muestra el número y el total devueltos por la API; confirma que el pedido aparezca en “Pedidos recientes” y que el stock disminuya.
5. Abre el pedido para consultar cliente, estado, productos, cantidades, precios y total. Pulsa **Cancelar** para comprobar que la API cambia el estado y devuelve las existencias. Puedes volver a mirar el producto en el catálogo.
6. Recarga la página: los productos, clientes y pedidos se vuelven a consultar desde el servidor y deben conservarse. La documentación de endpoints está en `/docs`.

## Consultas SQL de verificación

```sql
SELECT * FROM tienda_adso.clientes;
SELECT * FROM tienda_adso.productos;
SELECT p.id, c.nombre AS cliente, p.fecha, p.estado, p.total
FROM tienda_adso.pedidos p
JOIN tienda_adso.clientes c ON c.id = p.cliente_id;
SELECT d.pedido_id, pr.nombre AS producto, d.cantidad,
       d.precio_unitario, d.subtotal
FROM tienda_adso.detalle_pedidos d
JOIN tienda_adso.productos pr ON pr.id = d.producto_id;
```

## Decisiones transaccionales

- Los productos se bloquean con `SELECT ... FOR UPDATE` en orden de ID para evitar que dos solicitudes vendan simultáneamente las mismas unidades.
- Se comprueba cliente, producto y stock antes de insertar. Cualquier excepción dentro del contexto de conexión activa `ROLLBACK`; el retorno normal activa `COMMIT`.
- El precio unitario se copia al detalle para conservar el valor histórico aunque cambie el precio del catálogo.
- La cancelación bloquea el pedido, solo acepta el estado confirmado y devuelve cantidades dentro de la misma transacción.
- Se rechaza repetir el mismo producto en la lista para mantener cada línea simple y verificable.

## Estados y transiciones de pedidos

Los pedidos se crean confirmados por defecto, por lo que descuentan existencias como en el flujo principal. Si el cuerpo de `POST /pedidos` incluye `"estado":"pendiente"`, se guardan el encabezado y sus detalles sin descontar stock. Las transiciones permitidas son `pendiente → confirmado`, `pendiente → cancelado` y `confirmado → cancelado`; `POST /pedidos/{id}/confirmar` valida y reserva stock en una transacción, mientras que cancelar un pedido pendiente no toca el inventario. `cancelado` es un estado final.

## Respuestas de sustentación

- **¿Para qué sirve `detalle_pedidos`?** Para asociar múltiples productos con cada pedido, registrar cantidad y precio histórico y resolver la relación muchos-a-muchos.
- **¿Por qué se usan claves foráneas?** Para impedir referencias a clientes, pedidos o productos inexistentes y proteger la integridad de las relaciones.
- **¿Qué protege una transacción?** La atomicidad: un pedido completo con su detalle y su descuento, o ningún cambio si falla una validación o escritura.
- **¿Cómo se separa la lógica?** `main.py` compone la API; `database.py` gestiona conexión/transacción; `schemas.py` valida datos; `routers/` implementa recursos; `sql/` crea y carga la base.

## Códigos HTTP principales

`200` consulta/actualización, `201` creación, `204` borrado, `404` recurso inexistente, `409` correo duplicado, stock insuficiente, pedido ya cancelado o restricción relacional, y `422` cuerpo/query inválido.

Este proyecto es local y formativo; no incorpora autenticación ni autorización para exposición pública.
