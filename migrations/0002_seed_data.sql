-- =============================================
-- MÁS URBA - Datos de Prueba
-- =============================================

-- Usuario Admin (Samuel) - password: admin123
INSERT OR IGNORE INTO users (id, email, password_hash, name, phone, role) VALUES 
(1, 'samuel@masurba.es', 'd94dfbee4fc1c23e2f539406eeb0b1ab6b1362a3445133117c7c0d70c392a5b6', 'Samuel Castellano', '+34 600 000 001', 'admin');

-- Usuario Cliente de prueba - password: demo123
INSERT OR IGNORE INTO users (id, email, password_hash, name, phone, role) VALUES 
(2, 'cliente@demo.es', '7d1eb58a17a688050de987e489a4ddb82cdff899760b038a5088b3608fb600a2', 'María López', '+34 600 000 002', 'client');

-- Vivienda de prueba
INSERT OR IGNORE INTO properties (id, user_id, name, year_built, urbanization, property_type, address, square_meters, last_integral_reform, technical_score, notes) VALUES 
(1, 2, 'Chalet Los Robles', 1995, 'Los Robles', 'Chalet pareado', 'Calle del Pinar 15, Valdemorillo', 220, 2010, 65, 'Vivienda bien conservada, pendiente revisión cubierta');

-- Instalaciones de la vivienda
INSERT OR IGNORE INTO installations (property_id, type, is_updated, year_updated, perceived_state, notes) VALUES 
(1, 'electricity', 1, 2015, 'good', 'Cuadro actualizado'),
(1, 'plumbing', 0, NULL, 'regular', 'Tuberías originales, sin problemas visibles'),
(1, 'heating', 1, 2020, 'excellent', 'Caldera de condensación nueva'),
(1, 'insulation', 0, NULL, 'needs_attention', 'Ventanas originales de aluminio'),
(1, 'roof', 0, NULL, 'regular', 'Tejas en buen estado, revisar impermeabilización'),
(1, 'facade', 0, NULL, 'good', 'Pintada hace 5 años');

-- Mantenimientos
INSERT OR IGNORE INTO maintenances (property_id, category, status, last_checked, next_recommended, notes) VALUES 
(1, 'roof', 'pending', NULL, '2025-06-01', 'Revisión anual pendiente'),
(1, 'boiler', 'checked', '2024-11-15', '2025-11-15', 'Revisión anual realizada'),
(1, 'pool', 'pending', NULL, '2025-05-01', 'Preparación temporada'),
(1, 'garden', 'checked', '2025-02-01', '2025-03-15', 'Poda de invierno realizada'),
(1, 'electricity', 'checked', '2024-09-01', '2026-09-01', 'Inspección bienal OK'),
(1, 'plumbing', 'pending', NULL, NULL, 'Sin revisión reciente'),
(1, 'facade', 'checked', '2024-06-01', '2027-06-01', 'Buen estado general'),
(1, 'insulation', 'needs_repair', NULL, NULL, 'Valorar cambio de ventanas');

-- Memoria de Chari para el cliente
INSERT OR IGNORE INTO chari_memory (user_id, context, preferences, interaction_count, last_topics) VALUES 
(2, '{"property_type": "chalet", "main_concerns": ["insulation", "roof"], "budget_sensitivity": "medium"}', '{"communication_style": "detailed", "preferred_time": "morning"}', 3, '["ventanas", "presupuesto reforma", "cubierta"]');

-- Etiquetas del cliente
INSERT OR IGNORE INTO client_tags (user_id, tag_name, assigned_by, notes) VALUES 
(2, 'potential_sale', 1, 'Mencionó posible venta en 2-3 años'),
(2, 'educable_client', 1, 'Muy receptivo a recomendaciones');
