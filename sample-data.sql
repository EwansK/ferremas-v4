-- Sample Data for Ferremas E-commerce Database - Simplified Version
-- Run this after creating the schema

-- Insert roles
INSERT INTO roles (id, role_name) VALUES
('450e8400-e29b-41d4-a716-446655440001', 'admin'),
('450e8400-e29b-41d4-a716-446655440002', 'manager'),
('450e8400-e29b-41d4-a716-446655440003', 'customer');

-- Insert sample users (passwords are hashed versions of 'password123')
INSERT INTO users (id, name, lastname, email, password_hash, role_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Admin', 'Ferremas', 'admin@ferremas.cl', '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U', '450e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440002', 'Juan', 'Pérez', 'manager@ferremas.cl', '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U', '450e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440003', 'María', 'González', 'cliente1@gmail.com', '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U', '450e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440004', 'Carlos', 'Rodríguez', 'cliente2@gmail.com', '$2b$12$LQv3c1yqBwlVHpPjrO3uCu/Nwp2sTY0o8GU8U8G8U8G8U8G8U8G8U', '450e8400-e29b-41d4-a716-446655440003');

-- Insert categories
INSERT INTO categories (id, name) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'Herramientas Manuales'),
('750e8400-e29b-41d4-a716-446655440002', 'Herramientas Eléctricas'),
('750e8400-e29b-41d4-a716-446655440003', 'Materiales de Construcción'),
('750e8400-e29b-41d4-a716-446655440004', 'Ferretería'),
('750e8400-e29b-41d4-a716-446655440005', 'Jardín y Exterior');

-- Insert sample products
INSERT INTO products (id, category_id, name, quantity, price_clp, description, image_link) VALUES
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'Martillo de Carpintero 16oz', 25, 12990, 'Martillo de carpintero con mango de fibra de vidrio, cabeza de acero forjado de 16 onzas. Ideal para trabajos de carpintería y construcción general.', '/uploads/products/martillo-carpintero.jpg'),
('850e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', 'Taladro Inalámbrico 18V', 15, 89990, 'Taladro inalámbrico de 18V con batería de litio, incluye cargador y maletín. Motor sin escobillas para mayor durabilidad y rendimiento.', '/uploads/products/taladro-18v.jpg'),
('850e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440001', 'Set de Destornilladores 6 Piezas', 40, 8990, 'Set de 6 destornilladores con puntas Phillips y planas de diferentes tamaños. Mangos ergonómicos con grip antideslizante.', '/uploads/products/destornilladores-set.jpg'),
('850e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440002', 'Sierra Circular 7 1/4"', 8, 79990, 'Sierra circular de 7 1/4 pulgadas, motor de 1400W, guía láser para cortes precisos. Incluye hoja de sierra de 24 dientes.', '/uploads/products/sierra-circular.jpg'),
('850e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440001', 'Llave Inglesa Ajustable 10"', 30, 15990, 'Llave inglesa ajustable de 10 pulgadas, acero al cromo vanadio. Mandíbulas endurecidas y graduadas.', '/uploads/products/llave-inglesa.jpg'),
('850e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440003', 'Cemento Portland 25kg', 100, 4590, 'Cemento Portland de alta calidad para construcción. Saco de 25 kilogramos.', '/uploads/products/cemento-portland.jpg'),
('850e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440004', 'Tornillos Autorroscantes x100', 200, 2990, 'Set de 100 tornillos autorroscantes de 1 pulgada para madera y metal.', '/uploads/products/tornillos-set.jpg'),
('850e8400-e29b-41d4-a716-446655440008', '750e8400-e29b-41d4-a716-446655440005', 'Pala de Jardín', 20, 12990, 'Pala de jardín con mango de madera resistente y hoja de acero inoxidable.', '/uploads/products/pala-jardin.jpg');

-- Add some sample cart items
INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES
('d50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440001', 2),
('d50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440003', 1),
('d50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440002', 1);

-- Create a sample order
INSERT INTO orders (id, user_id, total_clp, status) VALUES
('e50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 89990, 'delivered');

-- Insert order items for the sample order
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_clp) VALUES
('f50e8400-e29b-41d4-a716-446655440001', 'e50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440002', 1, 89990);