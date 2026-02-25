-- =============================================
-- MÁS URBA - Almacenamiento de Medios
-- Imágenes y vídeos de propiedades y mantenimientos
-- =============================================

-- MEDIOS DE LA VIVIENDA (fotos/vídeos generales de la propiedad)
CREATE TABLE IF NOT EXISTS property_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
    media_url TEXT NOT NULL,
    media_base64 TEXT,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK(category IN ('general', 'exterior', 'interior', 'garden', 'pool', 'garage', 'other')),
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- MEDIOS DE MANTENIMIENTO (fotos/vídeos asociados a mantenimientos específicos)
-- Ya existe maintenance_photos, pero la expandimos con ALTER o recreamos
-- Añadimos soporte para vídeos y más metadata

CREATE TABLE IF NOT EXISTS maintenance_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    maintenance_id INTEGER,
    property_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('roof', 'electricity', 'plumbing', 'boiler', 'facade', 'insulation', 'pool', 'garden', 'other')),
    media_type TEXT NOT NULL CHECK(media_type IN ('image', 'video')),
    media_url TEXT NOT NULL,
    media_base64 TEXT,
    thumbnail_url TEXT,
    title TEXT,
    description TEXT,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (maintenance_id) REFERENCES maintenances(id) ON DELETE SET NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_property_media_property ON property_media(property_id);
CREATE INDEX IF NOT EXISTS idx_property_media_user ON property_media(user_id);
CREATE INDEX IF NOT EXISTS idx_property_media_category ON property_media(category);
CREATE INDEX IF NOT EXISTS idx_maintenance_media_property ON maintenance_media(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_media_user ON maintenance_media(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_media_category ON maintenance_media(category);
