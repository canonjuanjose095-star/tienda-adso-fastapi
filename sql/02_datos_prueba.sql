USE tienda_adso;

-- Ejecutar una sola vez para evitar duplicar los datos de demostración.
INSERT INTO clientes (nombre, correo) VALUES
  ('Ana Pérez', 'ana@example.com'),
  ('Carlos Ruiz', 'carlos@example.com');

INSERT INTO productos (nombre, precio, stock) VALUES
  ('Mouse', 35000.00, 12),
  ('Teclado', 80000.00, 8),
  ('Monitor', 650000.00, 4);
