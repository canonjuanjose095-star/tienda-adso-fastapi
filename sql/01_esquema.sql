-- Etapa inicial: catálogo y clientes.
CREATE DATABASE IF NOT EXISTS tienda_adso
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tienda_adso;

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_producto_precio CHECK (precio > 0),
  CONSTRAINT chk_producto_stock CHECK (stock >= 0)
) ENGINE=InnoDB;
