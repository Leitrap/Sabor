-- Crear tabla de productos
CREATE TABLE products (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  image TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id INTEGER
);

-- Crear tabla de clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  vendor_name TEXT NOT NULL,
  store_location TEXT,
  total INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  final_total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  notes TEXT
);

-- Crear tabla de items de pedidos
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Insertar datos iniciales de productos
INSERT INTO products (id, name, price, image, stock, category_id) VALUES
(1, 'Nueces Peladas', 3500, '/placeholder.svg?height=200&width=200', 50, 1),
(2, 'Almendras', 4200, '/placeholder.svg?height=200&width=200', 45, 1),
(3, 'Castañas de Cajú', 3800, '/placeholder.svg?height=200&width=200', 30, 1),
(4, 'Pistachos', 5000, '/placeholder.svg?height=200&width=200', 25, 1),
(5, 'Avellanas', 4500, '/placeholder.svg?height=200&width=200', 35, 1),
(6, 'Maní Tostado', 2200, '/placeholder.svg?height=200&width=200', 100, 1),
(7, 'Mix Tropical', 3900, '/placeholder.svg?height=200&width=200', 40, 4),
(8, 'Pasas de Uva', 2800, '/placeholder.svg?height=200&width=200', 60, 2),
(9, 'Arándanos Secos', 4100, '/placeholder.svg?height=200&width=200', 20, 2),
(10, 'Dátiles', 3600, '/placeholder.svg?height=200&width=200', 30, 2),
(11, 'Higos Secos', 3300, '/placeholder.svg?height=200&width=200', 25, 2),
(12, 'Ciruelas Pasas', 2900, '/placeholder.svg?height=200&width=200', 40, 2),
(13, 'Mix Energético', 4300, '/placeholder.svg?height=200&width=200', 35, 4),
(14, 'Semillas de Girasol', 2500, '/placeholder.svg?height=200&width=200', 70, 3),
(15, 'Semillas de Calabaza', 2700, '/placeholder.svg?height=200&width=200', 55, 3),
(16, 'Semillas de Chía', 3100, '/placeholder.svg?height=200&width=200', 45, 3),
(17, 'Semillas de Lino', 2400, '/placeholder.svg?height=200&width=200', 50, 3),
(18, 'Mix Premium', 4800, '/placeholder.svg?height=200&width=200', 30, 4);

-- Crear políticas de seguridad para acceso público
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir acceso anónimo (para desarrollo)
CREATE POLICY "Allow anonymous select" ON products FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON products FOR DELETE USING (true);

CREATE POLICY "Allow anonymous select" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON customers FOR DELETE USING (true);

CREATE POLICY "Allow anonymous select" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON orders FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON orders FOR DELETE USING (true);

CREATE POLICY "Allow anonymous select" ON order_items FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete" ON order_items FOR DELETE USING (true);

