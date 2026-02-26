-- =============================================
-- INMOURBA - Anuncios inmobiliarios automáticos
-- =============================================

CREATE TABLE IF NOT EXISTS inmourba_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  listing_type TEXT NOT NULL DEFAULT 'sale', -- 'sale' o 'rent'
  price INTEGER, -- NULL = "A consultar"
  price_type TEXT DEFAULT 'fixed', -- 'fixed', 'negotiable', 'to_consult'
  title TEXT,
  description TEXT,
  -- Datos copiados de la vivienda (snapshot)
  property_data TEXT, -- JSON con datos de la vivienda
  installations_data TEXT, -- JSON con estado instalaciones
  maintenances_data TEXT, -- JSON con mantenimientos
  images TEXT, -- JSON array de imágenes
  technical_score INTEGER, -- Puntuación técnica al momento de publicar
  -- Estado
  status TEXT DEFAULT 'active', -- 'active', 'reserved', 'sold', 'rented', 'paused', 'deleted'
  views_count INTEGER DEFAULT 0,
  contacts_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  -- Verificación
  verified_by_samuel INTEGER DEFAULT 0,
  verification_date DATETIME,
  verification_notes TEXT,
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sold_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Comentarios en anuncios inmobiliarios
CREATE TABLE IF NOT EXISTS inmourba_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_from_chari INTEGER DEFAULT 0, -- Si es comentario automático de Chari
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES inmourba_listings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- MERCADILLO - Compraventa entre vecinos
-- =============================================

CREATE TABLE IF NOT EXISTS mercadillo_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  price_negotiable INTEGER DEFAULT 1,
  category TEXT DEFAULT 'otros', -- 'muebles', 'electronica', 'jardin', 'hogar', 'motor', 'otros'
  condition TEXT DEFAULT 'good', -- 'new', 'like_new', 'good', 'fair'
  images TEXT, -- JSON array de imágenes (hasta 6)
  -- Ubicación
  urbanization TEXT,
  -- Estado
  status TEXT DEFAULT 'available', -- 'available', 'reserved', 'sold', 'deleted'
  reserved_by INTEGER, -- user_id del que reservó
  reserved_at DATETIME,
  -- Contadores
  views_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sold_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reserved_by) REFERENCES users(id)
);

-- Comentarios en artículos del mercadillo
CREATE TABLE IF NOT EXISTS mercadillo_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_from_chari INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES mercadillo_items(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =============================================
-- USUARIO CHARI BOT
-- =============================================

-- Insertar usuario Chari si no existe (debe usar rol 'client' por restricción de la tabla)
INSERT OR IGNORE INTO users (id, email, password_hash, name, phone, role, is_active)
VALUES (999, 'chari.bot@masurba.es', 'BOT_NO_LOGIN', 'Chari 🤖', '', 'client', 1);

-- Tabla para posts/comentarios automáticos de Chari
CREATE TABLE IF NOT EXISTS chari_auto_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL, -- 'porche_post', 'inmourba_comment', 'mercadillo_comment'
  target_id INTEGER, -- ID del post/listing/item al que responde (NULL si es post nuevo)
  content TEXT NOT NULL,
  category TEXT, -- Categoría del contenido
  is_published INTEGER DEFAULT 0,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_inmourba_user ON inmourba_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_inmourba_status ON inmourba_listings(status);
CREATE INDEX IF NOT EXISTS idx_inmourba_type ON inmourba_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_inmourba_comments_listing ON inmourba_comments(listing_id);

CREATE INDEX IF NOT EXISTS idx_mercadillo_user ON mercadillo_items(user_id);
CREATE INDEX IF NOT EXISTS idx_mercadillo_status ON mercadillo_items(status);
CREATE INDEX IF NOT EXISTS idx_mercadillo_category ON mercadillo_items(category);
CREATE INDEX IF NOT EXISTS idx_mercadillo_comments_item ON mercadillo_comments(item_id);
