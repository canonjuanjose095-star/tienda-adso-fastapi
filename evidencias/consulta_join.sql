SELECT
    p.id AS pedido_id,
    c.nombre AS cliente,
    pr.nombre AS producto,
    d.cantidad,
    d.precio_unitario,
    d.subtotal,
    p.total
FROM pedidos AS p
JOIN clientes AS c ON c.id = p.cliente_id
JOIN detalle_pedidos AS d ON d.pedido_id = p.id
JOIN productos AS pr ON pr.id = d.producto_id
ORDER BY p.id, d.id;
